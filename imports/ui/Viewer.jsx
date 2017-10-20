import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Button, Col, Navbar, NavItem, Nav, NavDropdown, MenuItem, Jumbotron } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import dicomParse from 'dicom-parser';
import FS from 'fs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import FontAwesome from 'react-fontawesome';
import io from '../library/socket';
import { Marks } from '../api/marks';
import { ToastContainer, toast } from 'react-toastify';
import { _ } from 'underscore';

import "./css/viewer.css"


const style = {
  body: {
    backgroundColor: 'black',
    minHeight: '100%',
    maxHeight: '100%'
  },
  top: {
    height: 'auto',
    backgroundColor: '#7f7f7f',
    width: '100%',
    position: 'relative',
    left: '0px',
  },
  bottom: {
    position: 'fixed',
    width: '100%',
    left: '0',
    bottom: '0',
    height: '0',
    backgroundColor: '#7f7f7f'
  },
  container: {
    position: 'absolute',
    border: '1px solid #3bc7f9',
    display: 'inline-block',
    float: 'left',
    width: '80%'
  },
  viewer: {
    top: '30px',
    height: '800px',
    width: '100%',
    position: 'relative',
    margin: '0 auto'
  },
  textInfo: {
    color: '#91b9cd',
    fontSize: '14px',
    fontWeight: '400'
  },
  patientInfo: {
    position: 'absolute',
    top: '0px',
    left: '15px',
    height: '100px',
    width: '250px',
    color: 'white'
  },
  dicomInfo: {
    position: 'absolute',
    bottom: '0px',
    right: '25px',
    height: '50px',
    width: '200px',
    color: 'white',
    marginBottom: '-20px'
  },
  sliceInfo: {
    position: 'absolute',
    bottom: '0px',
    left: '15px',
    height: '50px',
    width: '400px',
    color: 'white',
    marginBottom: '-20px'
  },
  timeInfo: {
    position: 'absolute',
    top: '0px',
    right: '10px',
    height: '100px',
    width: '200px',
    color: 'white'
  },
  scrollBar: {
    height: '10px',
    backgroundColor: 'black',
    position: 'absolute',
    borderRadius: '4px',
    opacity: '0.5',
    WebkitAppearance: "none",
    WebkitTransform: "rotate(90deg)",
    border: "none",
    outline: "none",
  },
  disableSelection: {
    userSelect: 'none',
    MozUserSelect: 'none',
    KhtmlUserSelect: 'none',
    WebkitUserSelect: 'none',
    OUserSelect: 'none',
    cursor: 'default'
  },
  icon: {
    textAlign: "center",
    verticalAlign: "center",
  },
  diagnosisInfo: {
    position: 'relative',
    width: '20%',
    display: 'none',
    float: 'left',
    border: '1px solid #aaf7f4',
  }

};

export default class Viewer extends Component {
  /**
   * constructor, run at first
   * @param props
   */
  constructor(props) {
    super(props);
    this.state = {
      container: {},
      dicomObj: {},
      circleVisible: true,
      index: 1,
      imageNumber: 0,
      zoomScale: 0,
      voi: {
        windowCenter: 0,
        windowWidth: 0
      },
      dateTime: new Date().toLocaleString(),
      isScrollBarHovered: false,
      isScrollBarClicked: false,
      scrollBarStyle: style.scrollBar,
      timer: undefined,
      lastY: 0,
      startY: 0,

      isDiagnosisPanelOpened: false

    };
    this.updateInfo = this.updateInfo.bind(this);
    this.setSlice = this.setSlice.bind(this);
    this.onDragScrollBar = this.onDragScrollBar.bind(this);
    Meteor.subscribe('cases');
  }

  /**
   * will run after elements rendered
   */
  componentDidMount() {
    /**
     * re-render when window resized
     */
    window.addEventListener('resize', () => this.updateDimensions());

    /**
     * disable right click in canvas
     */
    document.getElementById('outerContainer').oncontextmenu = function (e) {
      e.preventDefault();
    };

    /**
     * set the dynamic height for container
     */
    this.setState({
      containerHeight: (window.innerHeight - document.getElementById('top').clientHeight) + 'px',
      containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth) + 'px',
      topValue: (window.innerHeight - document.getElementById('top').clientHeight) / 2 - 8 + "px",
      rightValue: -((window.innerHeight - document.getElementById('top').clientHeight) / 2 - 10) + 'px'
    });

    this.setState({
      container: document.getElementById("viewer")
    }, (err) => {
      if (err) {
        return console.log(err);
      }

      cornerstone.enable(document.getElementById("viewer"));
      cornerstoneTools.addStackStateManager(this.state.container, ['stack']);
      cornerstoneTools.toolColors.setToolColor("#ffcc33");
    });

    window.setInterval(() => {
      this.setState({
        dateTime: new Date().toLocaleString()
      });
    });

    Meteor.call('prepareDicoms', this.props.location.query.caseId, (error, result) => {

      if (error) {
        console.log(error)
      } else {
        if (result.status === "SUCCESS") {
          this.setState({
            imageNumber: result.imageNumber,
            patientId: result.patientId,
            patientName: result.patientName,
            rows: result.rows,
            cols: result.cols,
            pixelSpacing: result.pixelSpacing,
            thickness: result.thickness
          });
          this.setSlice(this.state.index);
          //set info here
          let element = $("#viewer");
          element.on("CornerstoneImageRendered", this.updateInfo);
        }

      }
    });



  }

  componentWillUnmount() {
    window.removeEventListener("resize", () => this.updateDimensions());
  }

  /**
   * update info dynamically
   * @param e
   */
  updateInfo(e) {
    let viewport = cornerstone.getViewport(e.target);
    this.setState({
      voi: {
        windowWidth: viewport.voi.windowWidth,
        windowCenter: viewport.voi.windowCenter
      },
      zoomScale: viewport.scale.toFixed(2)
    });
  }

  /**
   * updates window dimensions
   */
  updateDimensions() {
    console.log('resize');
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    })
  }

  /**
   * increase slice number
   */
  increaseSlice() {
    if (this.state.index < this.state.imageNumber) {
      this.setSlice(this.state.index + 1);
    }
  }

  /**
   * decrease slice number
   */
  decreaseSlice() {
    if (this.state.index > 1) {
      this.setSlice(this.state.index - 1);
    }
  }

  /**
   * set image slice
   * @param index image index
   */
  setSlice(index) {
    if (!this.state.dicomObj[index]) {
      Meteor.call('getDicom', index, (err, result) => {
        let image = result;
        let pixelData = new Uint16Array(image.imageBuf.buffer, image.pixelDataOffset, image.pixelDataLength / 2);
        image.getPixelData = function () {
          return pixelData
        };
        let currentObj = this.state.dicomObj;
        currentObj[index] = image;
        this.setState({
          dicomObj: currentObj
        });

        var viewport = {};
        if (index === 1) {
          viewport.scale = 1.2;
        }
        cornerstone.displayImage(this.state.container, this.state.dicomObj[index], viewport);
      });
    } else {
      cornerstone.displayImage(this.state.container, this.state.dicomObj[index])
    }
    let scrollbar = document.getElementById("scrollbar");
    scrollbar.value = index;
    this.setState({
      index: index
    });
  }

  /**
   * handle tool selection
   * @param selectedKey the key of selected MenuItem
   */
  navSelectHandler(selectedKey) {
    switch (selectedKey) {
      case 1:
        this.setScrollTool();
        break;

      case 2:
        this.setWindowTool();
        break;

      case 3:
        this.setZoomTool();
        break;

      case 4:
        this.setLengthTool();
        break;

      case 5:
        this.setDrawTool();
        break;

      case 6:
        this.setEllipticalTool();
        break;

      case 7:
        this.resetViewport();
        break;

      case 8:
        this.saveState();
        break;

      case 9:
        this.restoreState();
        break;

      case 10:
        this.switchState();
        break;


      case 11:
        this.diagnose();
        break;

      default:
        console.log(error);
    }
  }

  /**
   * activate scroll tool, enable both mousewheel and mouse select
   */
  setScrollTool() {
    let element = $("#viewer");
    let self = this;
    this.disableAllTools();
    element.bind("mousewheel", function (e) {
      let event = window.event || e;
      let down = event.wheelDelta < 0;
      if (down) {
        self.increaseSlice();
      } else {
        self.decreaseSlice();
      }
    });
  }

  /**
   * activate window width and window level function
   */
  setWindowTool() {
    this.disableAllTools();
    cornerstoneTools.wwwc.activate(this.state.container, 1);
  }

  /**
   * activate zoom and pan function
   */
  setZoomTool() {
    this.disableAllTools();

    var config = {
      // invert: true,
      minScale: 0.25,
      maxScale: 20.0,
      preventZoomOutsideImage: true
    };
    cornerstoneTools.zoom.setConfiguration(config);

    let element = this.state.container;
    cornerstoneTools.pan.activate(element, 1);
    cornerstoneTools.zoom.activate(element, 4);
    cornerstoneTools.zoomWheel.activate(element);
  }

  /**
   * call algorithm to predict result
   */
  predict() {
    // let socket = io('http://localhost:8000');
    // socket.on('result', function (data) {
    //     console.log(data);
    // })


  }

  /**
   * activate rectangle draw function
   */
  setDrawTool() {
    this.disableAllTools();
    cornerstoneTools.rectangleRoi.activate(this.state.container, 1);
  }

  setEllipticalTool() {
    this.disableAllTools();
    cornerstoneTools.ellipticalRoi.activate(this.state.container, 1);
  }

  setLengthTool() {
    this.disableAllTools();
    cornerstoneTools.length.activate(this.state.container, 1);
  }

  /**
   * save mark to database
   */
  saveState() {
    this.disableAllTools();
    let elements = [this.state.container];
    let currentState = cornerstoneTools.appState.save(elements);
    let appState = JSON.parse(JSON.stringify(currentState))
    _.mapObject(appState.imageIdToolState, (val, imageId) => {
      _.mapObject(val, (data, toolName) => {
        if (toolName === 'ellipticalRoi') {
          appState.imageIdToolState[imageId].ellipticalRoi.data = []
        }
      })
    });

    let mark = {
      imageIdToolState: appState.imageIdToolState,
      elementToolState: appState.elementToolState,
      elementViewport: appState.elementViewport,
      source: 'USER',
      createAt: new Date(),
      caseId: this.props.location.query.caseId,
      ownerId: Meteor.userId(),
    };

    let oldState = Marks.findOne({ ownerId: Meteor.userId(), caseId: this.props.location.query.caseId });
    if (oldState) {
      mark._id = oldState._id;
      Meteor.call('modifyMark', mark, (error) => {
        if (error) {
          toast.error(`标注保存失败,${error.reacon}`)
        } else {
          toast.success("标注保存成功!");
        }
      })
    } else {
      Meteor.call('insertMark', mark, (error) => {
        if (error) {
          toast.error(`标注保存失败,${error.reacon}`)
        } else {
          toast.success("标注保存成功!");
        }
      })
    }
  }

  /**
   * reload mark from database
   */
  restoreState() {
    this.disableAllTools();
    let elements = [this.state.container];
    let currentState = cornerstoneTools.appState.save(elements);
    let oldState = Marks.findOne({ ownerId: Meteor.userId(), caseId: this.props.location.query.caseId });

    /**
     * save system mark to old mark
     */
    _.mapObject(currentState.imageIdToolState, (currentVal, currentImageId) => {
      _.mapObject(oldState.imageIdToolState, (oldVal, oldImageId) => {
        if (currentImageId === oldImageId) {
          _.mapObject(currentVal, (data, type) => {
            if (type === 'ellipticalRoi') {
              oldState.imageIdToolState[oldImageId]['ellipticalRoi']['data'] = data.data
            }
          })
        }
      })
    });
    console.log(oldState);

    cornerstoneTools.appState.restore(oldState)
  }

  /**
   * reset viewport to default state
   */
  resetViewport() {
    let canvas = $('#viewer canvas').get(0);
    let enabledElement = cornerstone.getEnabledElement(this.state.container);
    let viewport = cornerstone.getDefaultViewport(canvas, enabledElement.image);
    viewport.scale = 1.2;
    cornerstone.setViewport(this.state.container, viewport);
  }

  /**
   * switch circle visible state
   */
  switchState() {
    this.disableAllTools();
    if (this.state.circleVisible) {
      cornerstoneTools.ellipticalRoi.disable(this.state.container, 1);
      this.setState({
        circleVisible: false
      })
    } else {
      cornerstoneTools.ellipticalRoi.activate(this.state.container, 1);
      // cornerstoneTools.ellipticalRoi.enable(this.state.container, 1);
      this.setState({
        circleVisible: true
      })
    }
  }

  /**
   * get diagnosis information from backend
   */
  diagnose() {
    let temp = {
      "1_53": { "y1": 127, "y0": 80, "x0": 190, "x1": 227, "prob": 0.99508569469171382 },
      "1_54": { "y1": 133, "y0": 77, "x0": 189, "x1": 231, "prob": 0.99508569469171382 },
      "1_55": { "y1": 136, "y0": 77, "x0": 189, "x1": 237, "prob": 0.99508569469171382 },
      "1_56": { "y1": 135, "y0": 78, "x0": 190, "x1": 240, "prob": 0.99508569469171382 },
      "1_57": { "y1": 133, "y0": 82, "x0": 197, "x1": 245, "prob": 0.99508569469171382 },
      "1_58": { "y1": 135, "y0": 85, "x0": 200, "x1": 245, "prob": 0.99508569469171382 },
      "1_59": { "y1": 135, "y0": 93, "x0": 210, "x1": 245, "prob": 0.99508569469171382 },
      "1_60": { "y1": 135, "y0": 98, "x0": 211, "x1": 245, "prob": 0.99508569469171382 },
      "1_61": { "y1": 132, "y0": 107, "x0": 219, "x1": 243, "prob": 0.99508569469171382 },
      "1_62": { "y1": 128, "y0": 110, "x0": 224, "x1": 243, "prob": 0.99508569469171382 },
      "2_17": { "y1": 408, "y0": 384, "x0": 160, "x1": 184, "prob": 0.99221461777707087 },
      "2_18": { "y1": 408, "y0": 382, "x0": 160, "x1": 186, "prob": 0.99221461777707087 },
      "2_19": { "y1": 403, "y0": 380, "x0": 165, "x1": 186, "prob": 0.99221461777707087 },
      "2_20": { "y1": 403, "y0": 382, "x0": 165, "x1": 184, "prob": 0.99221461777707087 },
      "3_43": { "y1": 135, "y0": 109, "x0": 155, "x1": 172, "prob": 0.99058158466960267 },
      "3_44": { "y1": 148, "y0": 101, "x0": 147, "x1": 186, "prob": 0.99058158466960267 },
      "3_45": { "y1": 149, "y0": 91, "x0": 147, "x1": 192, "prob": 0.99058158466960267 },
      "3_46": { "y1": 148, "y0": 90, "x0": 146, "x1": 196, "prob": 0.99058158466960267 },
      "3_47": { "y1": 146, "y0": 88, "x0": 150, "x1": 200, "prob": 0.99058158466960267 },
      "3_48": { "y1": 146, "y0": 88, "x0": 154, "x1": 204, "prob": 0.99058158466960267 },
      "3_49": { "y1": 146, "y0": 88, "x0": 158, "x1": 205, "prob": 0.99058158466960267 },
      "3_50": { "y1": 146, "y0": 90, "x0": 160, "x1": 205, "prob": 0.99058158466960267 },
      "3_51": { "y1": 146, "y0": 91, "x0": 165, "x1": 207, "prob": 0.99058158466960267 },
      "3_52": { "y1": 146, "y0": 93, "x0": 168, "x1": 207, "prob": 0.99058158466960267 },
      "3_53": { "y1": 141, "y0": 98, "x0": 178, "x1": 202, "prob": 0.99058158466960267 },
      "4_55": { "y1": 250, "y0": 232, "x0": 333, "x1": 355, "prob": 0.98716848544019287 },
      "4_56": { "y1": 251, "y0": 230, "x0": 329, "x1": 357, "prob": 0.98716848544019287 },
      "4_57": { "y1": 251, "y0": 230, "x0": 328, "x1": 360, "prob": 0.98716848544019287 },
      "4_58": { "y1": 251, "y0": 230, "x0": 328, "x1": 359, "prob": 0.98716848544019287 },
      "4_59": { "y1": 250, "y0": 235, "x0": 334, "x1": 352, "prob": 0.98716848544019287 },
      "5_61": { "y1": 151, "y0": 104, "x0": 240, "x1": 269, "prob": 0.982299394580053 },
      "5_62": { "y1": 154, "y0": 104, "x0": 237, "x1": 272, "prob": 0.982299394580053 },
      "5_63": { "y1": 157, "y0": 106, "x0": 235, "x1": 283, "prob": 0.982299394580053 },
      "5_64": { "y1": 156, "y0": 106, "x0": 238, "x1": 290, "prob": 0.982299394580053 },
      "5_65": { "y1": 152, "y0": 107, "x0": 243, "x1": 296, "prob": 0.982299394580053 },
      "5_66": { "y1": 148, "y0": 110, "x0": 253, "x1": 295, "prob": 0.982299394580053 }
    };

    let picList = {}
    _.mapObject(temp, (val, key) => {
      val.num = key.split("_")[0];
      if (picList[key.split("_")[1]] != undefined) {
        picList[key.split("_")[1]].push(val)
      } else {
        picList[key.split("_")[1]] = [val]
      }
    })
    let caseId = this.props.location.query.caseId;
    let elements = [this.state.container];
    let currentState = cornerstoneTools.appState.save(elements);
    _.mapObject(picList, (val, key) => {
      if (!currentState.imageIdToolState[`${caseId}#${key}`]) {
        currentState.imageIdToolState[`${caseId}#${key}`] = { ellipticalRoi: { data: [] } }
      }
      let tempList = [];
      _.each(val, (obj) => {
        const standard = {
          visible: true,
          active: false,
          invalidated: false,
          handles: {
            start: {
              "x": 146.26041666666666,
              "y": 91.83333333333331,
              "highlight": true,
              "active": false
            },
            end: {
              "x": 387.92708333333337,
              "y": 275.16666666666663,
              "highlight": true,
              "active": false
            },
            textBox: {
              "active": false,
              "hasMoved": false,
              "movesIndependently": false,
              "drawnIndependently": true,
              "allowedOutsideImage": true,
              "hasBoundingBox": true,
            }
          },
        }
        standard.handles.start.x = obj.x0;
        standard.handles.start.y = obj.y0;
        standard.handles.end.x = obj.x1;
        standard.handles.end.y = obj.y1;
        tempList.push(standard)
      })
      currentState.imageIdToolState[`${caseId}#${key}`].ellipticalRoi = { data: tempList }
    })
    this.setState({
      isDiagnosisPanelOpened: !this.state.isDiagnosisPanelOpened
    }, function () {
      var self = this;
      if (this.state.isDiagnosisPanelOpened) {
        $('#diagnosisInfo').fadeIn({
          start: function () {
            self.setState({
              containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth - 7) + 'px'
            }, function () {
              cornerstone.resize(this.state.container, false);
            });
          }
        });
      } else {
        $('#diagnosisInfo').fadeOut({
          done: function () {
            self.setState({
              containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth) + 'px'
            }, function () {
              cornerstone.resize(this.state.container, false);
            });
          }
        });
      }
    });
  }

  /**
   * disable tools
   */
  disableAllTools() {
    let element = $("#viewer");
    element.off("mousewheel");
    element.off("mousemove");
    cornerstoneTools.mouseInput.enable(this.state.container);
    cornerstoneTools.mouseWheelInput.enable(this.state.container);
    cornerstoneTools.rectangleRoi.deactivate(this.state.container, 1);
    this.state.circleVisible && cornerstoneTools.ellipticalRoi.deactivate(this.state.container, 1);
    cornerstoneTools.wwwc.deactivate(this.state.container, 1);
    cornerstoneTools.pan.deactivate(this.state.container, 1);
    cornerstoneTools.zoom.deactivate(this.state.container, 4);
    cornerstoneTools.zoomWheel.deactivate(this.state.container);
    cornerstoneTools.length.deactivate(this.state.container, 1);
  }


  /**
   * handler for draging the scroll bar, moves scrollbar position and changes image
   * @param evt mousemove event
   */
  onDragScrollBar() {
    let scrollbar = document.getElementById("scrollbar");
    this.setSlice(parseInt(scrollbar.value));
  }

  render() {
    // style={{color: '#9ccef9'}}
    return (
      <div id="body" style={style.body}>
        <div id="top" style={style.top}>
          <Navbar inverse collapseOnSelect style={{ marginBottom: '0' }}>
            <Navbar.Collapse>
              <Nav onSelect={(selectedKey) => this.navSelectHandler(selectedKey)}>
                <NavItem eventKey={1} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='gear' size='2x' />
                  </div>
                  <span>scroll</span>
                </NavItem>
                <NavItem eventKey={2} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='adjust' size='2x' />
                  </div>
                  <span>wl/wc</span>
                </NavItem>
                <NavItem eventKey={3} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='search' size='2x' />
                  </div>
                  <span>zoom/pan</span>
                </NavItem>
                <NavItem eventKey={4} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='arrows-h' size='2x' />
                  </div>
                  <span>length</span>
                </NavItem>
                <NavItem eventKey={5} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='square-o' size='2x' />
                  </div>
                  <span>draw</span>
                </NavItem>
                <NavItem eventKey={6} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='circle-o' size='2x' />
                  </div>
                  <span>circle</span>
                </NavItem>
                <NavItem eventKey={7} href="#">
                  <div>
                    <FontAwesome name='refresh' size='2x' />
                  </div>
                  <span>reset</span>
                </NavItem>
                <NavItem eventKey={8} href="#">
                  <div>
                    <FontAwesome name='save' size='2x' />
                  </div>
                  <span>save</span>
                </NavItem>
                <NavItem eventKey={9} href="#">
                  <div>
                    <FontAwesome name='paste' size='2x' />
                  </div>
                  <span>restore</span>
                </NavItem>
                <NavItem eventKey={10} href="#">
                  <div>
                    <FontAwesome name={this.state.circleVisible ? 'eye-slash' : 'eye'} size='2x' />
                  </div>
                  <span>{this.state.circleVisible ? 'hide' : 'show'}</span>
                </NavItem>
                <NavItem eventKey={11} href="#">
                  <div>
                    <FontAwesome name='stethoscope' size='2x' />
                  </div>
                  <span>Diagnose</span>
                </NavItem>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        </div>
        <div id="diagnosisInfo" style={{ ...style.diagnosisInfo, ...{ height: this.state.containerHeight } }}></div>

        <div id="outerContainer" style={{ ...style.container, ...{ height: this.state.containerHeight, width: this.state.containerWidth } }} className="container">
          <input type={"range"}
            id={"scrollbar"}
            min={1}
            max={this.state.imageNumber}
            step={1}
            onInput={this.onDragScrollBar}
            style={{
              ...style.scrollBar, ...{ width: this.state.containerHeight },
              ...{ top: this.state.topValue }, ...{ right: this.state.rightValue }
            }} />
          <div style={style.viewer} ref="viewerContainer" id="viewer" >
            <div style={{ ...style.patientInfo, ...style.textInfo, ...style.disableSelection }} id="patientInfo">
              <div>
                <span>Patient name: {this.state.patientName}</span>
                <br />
                <span>Patient id: {this.state.patientId}</span>
              </div>
            </div>
            <div style={{ ...style.dicomInfo, ...style.textInfo, ...style.disableSelection }} id="dicomInfo">
              <span className="pull-right">WW/WC: {this.state.voi.windowWidth}/{this.state.voi.windowCenter}</span>
              <br />
              <span className="pull-right">Zoom: {this.state.zoomScale}</span>
            </div>
            <div style={{ ...style.sliceInfo, ...style.textInfo, ...style.disableSelection }} id="sliceInfo">
              <span className="pull-left">size: {this.state.rows}*{this.state.cols}</span>
              <br />
              <span className="pull-left">Slice: {this.state.index}/{this.state.imageNumber}</span>
              <br />
              <span className="pull-left">thick: {this.state.thickness} spacing: {this.state.pixelSpacing}</span>

            </div>
            <div style={{ ...style.timeInfo, ...style.textInfo, ...style.disableSelection }} id="timeInfo">
              <span className="pull-right">{this.state.dateTime}</span>
            </div>
          </div>
        </div>

        <div style={style.bottom}></div>
        <ToastContainer
          position="bottom-right"
          type="info"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
        />
      </div>
    )
  }
}
Meteor.subscribe('marks');
