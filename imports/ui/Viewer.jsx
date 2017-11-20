import { HTTP } from 'meteor/http';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Button, Navbar, NavItem, Nav, OverlayTrigger, Popover, ButtonGroup } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from '../library/cornerstoneTools';
import FontAwesome from 'react-fontawesome';
import { Cases } from '../api/cases';
import { Marks } from '../api/marks';
import { ToastContainer, toast } from 'react-toastify';
import { _ } from 'underscore';
import ReactSVG from 'react-svg';

import LeftPanel from './LeftPanel';
import MainCanvas from './MainCanvas';

import "./css/viewer.css";


const style = {
  body: {
    backgroundColor: 'black',
    minHeight: '100%',
    maxHeight: '100%'
  },
  top: {
    height: '80px',
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
    overflow: 'hidden'
  },
  icon: {
    textAlign: "center",
    verticalAlign: "center",
  },
  diagnosisBox: {
    position: 'relative',
    width: '20%',
    float: 'left',
    border: '1px solid #aaf7f4',
    padding: '10px 20px 10px 20px',
    color: '#9ccef9',
    fontSize: '12px',
    fontWeight: '300'
  },
  diagnosisHeader: {
    textAlign: 'center',
    fontWeight: '200'
  },
  diagnosisTableHead: {
    fontSize: '16px'
  },
  diagnosisRow: {
    padding: '10px 5px 10px 5px'
  },
  diagnosisProb: {
    textAlign: 'right'
  },
  diagnosisLink: {
    cursor: 'pointer'
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
      seriesList: [],
      circleVisible: true,
      zoomScale: 0,
      isScrollBarHovered: false,
      isScrollBarClicked: false,
      scrollBarStyle: style.scrollBar,
      timer: undefined,
      lastY: 0,
      startY: 0,
      curSeriesIndex: this.props.location.state.index ? this.props.location.state.index : 0,
      isDiagnosisPanelOpened: false,
      isLoadingPanelFinished: false,
      isMagnifyToolOpened: false,
      isRotateMenuOpened: false,
      imageLoaded: false,
      diagnosisButton: 'primary',
      thumbnailButton: 'default',
      loadingProgress: 0

    };
    this.updateInfo = this.updateInfo.bind(this);
    this.onDragScrollBar = this.onDragScrollBar.bind(this);
  }

  /**
   * will run after elements rendered
   */
  componentDidMount() {
    if (!Meteor.userId()) {
      browserHistory.replace('/login');
      toast.warning("请先登录再进行操作");
    }

    /**
     * make NavItems would not lose focus when clicked on the spare place in the page
     */
    $('li a').click(function (e) {
      $('a').removeClass('active-nav-item');
      $(this).addClass('active-nav-item');
    });

    /**
     * re-render when window resized
     */
    window.addEventListener('resize', () => this.updateDimensions());

    /**
     * disable right click in canvas and diagnosisBox
     */
    // document.getElementById('outerContainer').oncontextmenu = function (e) {
    //   e.preventDefault();
    // };
    // document.getElementById('diagnosisInfo').oncontextmenu = function (e) {
    //   e.preventDefault();
    // };

    /**
     * set the dynamic height for container
     */
    this.setState({
      containerHeight: (window.innerHeight - document.getElementById('top').clientHeight),
      // containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth),
      topValue: (window.innerHeight - document.getElementById('top').clientHeight) / 2 - 8 + "px",
      rightValue: -((window.innerHeight - document.getElementById('top').clientHeight) / 2 - 10) + 'px'
    });

    // this.getThumbnails(this.props.location.state.caseId);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", () => this.updateDimensions());
  }

  /**
   * download thumbnail information
   * @param caseId
   */
  getThumbnails(caseId) {
    Meteor.call('getThumbnailDicoms', caseId, (err, result) => {
      if (err) {
        return console.error(err);
      }
      this.setState({
        thumbnailArray: result.array
      }, function () {
        let foundCase = Cases.findOne({ _id: this.props.location.state.caseId });

        this.setState({
          seriesList: foundCase.seriesList,
        }, function () {
          for (let i = 0; i < this.state.seriesList.length; i++) {
            let element = document.getElementById('thumbnail' + i);
            cornerstone.enable(element);
            this.enableThumbnailCanvas(i, document.getElementById('thumbnail' + i));
          }
        });
      });
    });
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
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth - 3)
    }, function () {
      cornerstone.resize(this.state.container, false);
    });
  }

  /**
   * increase slice number
   */
  increaseSlice() {
    if (this.state.index < this.state.imageNumber) {
      this.setSlice(this.state.curSeriesIndex, this.state.index + 1);
    }
  }

  /**
   * decrease slice number
   */
  decreaseSlice() {
    if (this.state.index > 1) {
      this.setSlice(this.state.curSeriesIndex, this.state.index - 1);
    }
  }


  /**
   * handle tool selection
   * @param selectedKey the key of selected MenuItem
   */
  navSelectHandler(selectedKey) {
    switch (selectedKey) {
      case 1:
        this.setWindowTool();
        break;

      case 2:
        this.setZoomTool();
        break;

      case 3:
        this.setPanTool();
        break;

      case 4:
        this.setLengthTool();
        break;

      case 5:
        this.setDrawTool();
        break;

      case 6:
        this.setProbeTool();
        break;

      case 7:
        this.setAngleTool();
        break;

      case 8:
        this.setHighlightTool();
        break;

      case 9:
        this.setMagnifyTool();
        break;

      case 10:
        this.setAnnotationTool();
        break;

      default:
        console.error(error);
    }
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
    this.disableAllTools('ZOOM');

    var config = {
      // invert: true,
      minScale: 0.25,
      maxScale: 20.0,
      preventZoomOutsideImage: true
    };
    cornerstoneTools.zoom.setConfiguration(config);

    let element = this.state.container;
    cornerstoneTools.zoom.activate(element, 1);
    cornerstoneTools.zoomWheel.activate(element);
  }

  /**
   * activate pan function
   */
  setPanTool() {
    this.disableAllTools();
    cornerstoneTools.pan.activate(this.state.container, 1);
  }

  /**
   * activate rectangle draw function
   */
  setDrawTool() {
    this.disableAllTools();
    cornerstoneTools.rectangleRoi.activate(this.state.container, 1);
  }

  /**
   * active annotation tool
   */
  setAnnotationTool() {
    this.disableAllTools();
    cornerstoneTools.arrowAnnotate.activate(this.state.container, 1);
  }

  /**
   * activate length tool
   */
  setLengthTool() {
    this.disableAllTools();
    cornerstoneTools.length.activate(this.state.container, 1);
  }

  /**
   * activate probe tool
   */
  setProbeTool() {
    this.disableAllTools();
    cornerstoneTools.probe.activate(this.state.container, 1);
  }

  /**
   * activate angle tool
   */
  setAngleTool() {
    this.disableAllTools();
    cornerstoneTools.angle.activate(this.state.container, 1);
  }

  /**
   * activate hightlight tool
   */
  setHighlightTool() {
    this.disableAllTools();
    cornerstoneTools.highlight.activate(this.state.container, 1);
  }

  setMagnifyTool() {
    this.disableAllTools();
    cornerstoneTools.magnify.activate(this.state.container, 1);
  }

  /**
   * invert viewport
   */
  invertViewport() {
    let viewport = cornerstone.getViewport(this.state.container);
    viewport.invert = !viewport.invert;
    cornerstone.setViewport(this.state.container, viewport);
  }

  /**
   * save mark to database
   */
  saveState() {
    let elements = [this.state.container];
    let currentState = cornerstoneTools.appState.save(elements);
    let appState = JSON.parse(JSON.stringify(currentState));

    _.mapObject(appState.imageIdToolState, (val, imageId) => {
      _.mapObject(val, (data, toolName) => {
        if (toolName === 'ellipticalRoi') {
          appState.imageIdToolState[imageId].ellipticalRoi.data = []
        }
      })
    });

    let caseInfo = Cases.findOne({ _id: this.props.location.state.caseId });
    let seriesInstanceUID = caseInfo.seriesList[this.state.curSeriesIndex].seriesInstanceUID

    let mark = {
      imageIdToolState: appState.imageIdToolState,
      elementToolState: appState.elementToolState,
      elementViewport: appState.elementViewport,
      source: 'USER',
      createAt: new Date(),
      caseId: this.props.location.state.caseId,
      seriesInstanceUID: seriesInstanceUID,
      ownerId: Meteor.userId(),
    };

    let oldState = Marks.findOne({ ownerId: Meteor.userId(), seriesInstanceUID: seriesInstanceUID });
    if (oldState) {
      mark._id = oldState._id;
      Meteor.call('modifyMark', mark, (error) => {
        if (error) {
          toast.error(`标注保存失败,${error.reason}`);
          return console.error(error);
        } else {
          toast.success("标注保存成功!");
        }
      })
    } else {
      Meteor.call('insertMark', mark, (error) => {
        if (error) {
          toast.error(`标注保存失败,${error.reason}`);
          return console.error(error);
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
    let elements = [this.state.container];
    let currentState = cornerstoneTools.appState.save(elements);
    let caseInfo = Cases.findOne({ _id: this.props.location.state.caseId });
    let seriesInstanceUID = caseInfo.seriesList[this.state.curSeriesIndex].seriesInstanceUID
    let oldState = Marks.findOne({ ownerId: Meteor.userId(), seriesInstanceUID: seriesInstanceUID });
    /**
     * save system mark to old mark
     */
    if (oldState) {
      _.mapObject(currentState.imageIdToolState, (currentVal, currentImageId) => {
        _.mapObject(oldState.imageIdToolState, (oldVal, oldImageId) => {
          if (currentImageId === oldImageId) {
            _.mapObject(currentVal, (data, type) => {
              if (type === 'ellipticalRoi') {
                oldState.imageIdToolState[oldImageId]['ellipticalRoi'] = {};
                oldState.imageIdToolState[oldImageId]['ellipticalRoi']['data'] = data.data
              }
            })
          }
        })
      });

      cornerstoneTools.appState.restore(oldState)
    } else {
      toast.warning('无历史标注!')
    }

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
    if (this.state.circleVisible) {
      cornerstoneTools.ellipticalRoi.disable(this.state.container, 1);
      this.setState({
        circleVisible: false
      })
    } else {
      cornerstoneTools.ellipticalRoi.enable(this.state.container, 1);
      this.setState({
        circleVisible: true
      })
    }
  }

  /**
   * extract information in data
   */
  extract(data) {
    let diagnosisResult = {};
    let oldResult = this.state.diagnoseResult;
    for (let key in data) {
      let strs = key.split("_");

      if (diagnosisResult[strs[0]]) {
        diagnosisResult[strs[0]].lastSlice = parseInt(strs[1]);
      } else {
        diagnosisResult[strs[0]] = {};
        diagnosisResult[strs[0]].firstSlice = parseInt(strs[1]);
        diagnosisResult[strs[0]].prob = parseFloat(data[key].prob).toFixed(3);
      }
    }
    if (!oldResult) oldResult = {}
    oldResult[this.state.curSeriesIndex] = diagnosisResult
    this.setState({ diagnosisResult: oldResult });
  }

  /**
   * click handler for diagnosisRow, which changes styles and then jumps to the target slice
   */
  onClickDiagnosisRow(key) {
    $('div').removeClass('active-diagnosis-row');
    $('#diagnosis-item-' + key).addClass('active-diagnosis-row');
    this.setSlice(this.state.curSeriesIndex, Math.min(this.state.diagnosisResult[this.state.curSeriesIndex][key].firstSlice, this.state.diagnosisResult[this.state.curSeriesIndex][key].lastSlice));
  }

  /**
   * clear all tool data, e.g. rec, probe and angle
   */
  clearToolData() {
    let elements = [this.state.container];
    let currentState = cornerstoneTools.appState.save(elements);
    let element = cornerstone.getEnabledElement(this.state.container);
    let toolState = currentState.imageIdToolState;
    if (!toolState.hasOwnProperty(element.image.imageId)) {
      return;
    }

    for (let toolName in toolState[element.image.imageId]) {
      if (toolName !== 'ellipticalRoi') {
        delete toolState[element.image.imageId][toolName];
      }
    }

    cornerstone.updateImage(this.state.container);
  }

  /**
   * flip viewport
   */
  flipViewport(orientation) {
    let viewport = cornerstone.getViewport(this.state.container);

    if (orientation === 'HORIZONTAL') {
      viewport.hflip = !viewport.hflip;
    } else if (orientation === 'VERTICAL') {
      viewport.vflip = !viewport.vflip;
    }

    cornerstone.setViewport(this.state.container, viewport);
  }

  /**
   * rotate viewport
   */
  rotateViewport(orientation) {
    let viewport = cornerstone.getViewport(this.state.container);

    if (orientation === 'CLOCKWISE') {
      viewport.rotation += 90;
    } else if (orientation === 'COUNTERCLOCKWISE') {
      viewport.rotation -= 90;
    }

    cornerstone.setViewport(this.state.container, viewport);
  }

  /**
   * handler for draging the scroll bar, moves scrollbar position and changes image
   * @param evt mousemove event
   */
  onDragScrollBar() {
    let scrollbar = document.getElementById("scrollbar");
    this.setSlice(this.state.curSeriesIndex, parseInt(scrollbar.value));
  }

  getCaret(isOpened) {
    return isOpened ? <FontAwesome style={{ paddingLeft: '5px', position: 'absolute' }} name='caret-up' size='lg' /> :
      <FontAwesome style={{ paddingLeft: '5px', position: 'absolute', marginTop: '5px' }} name='caret-down' size='lg' />
  }

  /**
   * handler to switch series when clicking thumbnails
   * @param seriesIndex the index of requesting series
   */
  switchSeries(seriesIndex) {
    if (this.state.curSeriesIndex === seriesIndex) return;

    this.setState({
      curSeriesIndex: seriesIndex
    }, function () {
      this.initMainCanvas(this.props.location.state.caseId, this.state.curSeriesIndex);
    });
  }

  /**
   * draw thumbnails onto canvas
   * @param seriesIndex the index of requesting series
   * @param element the DOM element that holds corresponding thumbnail canvas
   */
  enableThumbnailCanvas(seriesIndex, element) {
    let image = this.state.thumbnailArray[seriesIndex];
    let pixelData = new Uint16Array(image.imageBuf.buffer, image.pixelDataOffset, image.pixelDataLength / 2);
    image.getPixelData = function () {
      return pixelData;
    };

    cornerstone.displayImage(element, image);
  }

  switchPanelState(isDiagnosis) {
    if ((isDiagnosis && this.state.diagnosisButton === 'primary') || (!isDiagnosis && this.state.thumbnailButton === 'primary')) {
      return
    }
    if (isDiagnosis) {
      this.setState({
        isDiagnosisPanelOpened: !this.state.isDiagnosisPanelOpened,
        diagnosisButton: 'primary',
        thumbnailButton: 'default'
      }, function () {
        for (let i = 0; i < this.state.seriesList.length; i++) {
          let element = document.getElementById('thumbnail' + i);
          cornerstone.enable(element);
          this.enableThumbnailCanvas(i, document.getElementById('thumbnail' + i));
        }

      });
    } else {
      this.setState({
        isDiagnosisPanelOpened: !this.state.isDiagnosisPanelOpened,
        diagnosisButton: 'default',
        thumbnailButton: 'primary'
      }, function () {
        let foundcase = Cases.findOne({ _id: this.props.location.state.caseId });
        const start = new Date().getTime();
        const caseInfo = Cases.findOne({ _id: this.props.location.state.caseId });
        const algorithmInfo = caseInfo.seriesList[this.state.curSeriesIndex].diagnoseResult;
        const seriesNumber = caseInfo.seriesList[this.state.curSeriesIndex].seriesNumber;
        if (algorithmInfo && algorithmInfo.circle) {
          const end = new Date().getTime();
          console.log("total time " + (end - start) / 1000);
          this.setState({ isLoadingPanelFinished: true });

          cornerstoneTools.ellipticalRoi.enable(this.state.container, 1);
          let caseId = this.props.location.state.caseId;
          let elements = [this.state.container];
          let currentState = cornerstoneTools.appState.save(elements);
          let result = JSON.parse(algorithmInfo.circle)
          if (!this.state.diagnosisResult || !this.state.diagnosisResult[this.state.curSeriesIndex]) {
            this.extract(result);
          }

          let picList = {};
          _.mapObject(result, (val, key) => {
            val.num = key.split("_")[0];
            if (picList[key.split("_")[1]] !== undefined) {
              picList[key.split("_")[1]].push(val)
            } else {
              picList[key.split("_")[1]] = [val]
            }
          });
          _.mapObject(picList, (val, key) => {
            if (!currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`]) {
              currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`] = { ellipticalRoi: { data: [] } }
            }
            let tempList = [];
            _.each(val, (obj) => {
              const standard = {
                visible: true,
                active: false,
                invalidated: false,
                handles: {
                  start: {
                    "x": 0,
                    "y": 0,
                    "highlight": true,
                    "active": false
                  },
                  end: {
                    "x": 0,
                    "y": 0,
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
                    "index": 1,
                  }
                },
              };
              standard.handles.start.x = obj.y0;
              standard.handles.start.y = obj.x0;
              standard.handles.end.x = obj.y1;
              standard.handles.end.y = obj.x1;
              standard.handles.textBox.index = obj.num;
              tempList.push(standard)
            });
            picList[key] = tempList;
            currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`].ellipticalRoi = { data: tempList }
          })

        } else {
          if (this.state.isDiagnosing) {
            toast.warning('诊断还未完成，请稍后');
            return
          }
          toast.warning('正在进行诊断，请等待');
          this.setState({
            isDiagnosing: true,
            isLoadingPanelFinished: false
          });
          HTTP.call('GET', Meteor.settings.public.ALGORITHM_SERVER + '/lung_nodule' +
            foundcase.seriesList[this.state.curSeriesIndex].path,
            (error, res) => {
              if (error) {
                return console.error(error);
              }
              if (res.content === 'error') {
                toast.error('服务器异常')
                this.setState({
                  isDiagnosing: false
                });
                return
              }
              console.log('res', res)
              toast.success('诊断完成')
              const end = new Date().getTime();
              console.log("total time " + (end - start) / 1000);
              this.setState({
                isLoadingPanelFinished: true,
                isDiagnosing: false
              });
              cornerstoneTools.ellipticalRoi.enable(this.state.container, 1);

              let caseId = this.props.location.state.caseId;
              let elements = [this.state.container];
              let currentState = cornerstoneTools.appState.save(elements);
              let result = JSON.parse(res.content);
              if (!this.state.diagnosisResult || !this.state.diagnosisResult[this.state.curSeriesIndex]) {
                this.extract(result);
              }

              let picList = {};
              _.mapObject(result, (val, key) => {
                val.num = key.split("_")[0];
                if (picList[key.split("_")[1]] != undefined) {
                  picList[key.split("_")[1]].push(val)
                } else {
                  picList[key.split("_")[1]] = [val]
                }
              });
              _.mapObject(picList, (val, key) => {
                if (!currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`]) {
                  currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`] = { ellipticalRoi: { data: [] } }
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
                        "index": 1,
                      }
                    },
                  };
                  standard.handles.start.x = obj.y0;
                  standard.handles.start.y = obj.x0;
                  standard.handles.end.x = obj.y1;
                  standard.handles.end.y = obj.x1;
                  standard.handles.textBox.index = obj.num;
                  tempList.push(standard)
                });
                picList[key] = tempList;
                currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`].ellipticalRoi = { data: tempList }
              })
            });
        }
      });
    }
  }

  render() {
    let results = [];

    if (this.state.diagnosisResult && this.state.diagnosisResult[this.state.curSeriesIndex]) {
      for (let key in this.state.diagnosisResult[this.state.curSeriesIndex]) {
        results.push(
          <div className="row diagnosisRow" style={style.diagnosisRow} key={'diagnosis-item-' + key} id={'diagnosis-item-' + key}
            onClick={() => this.onClickDiagnosisRow(key)}>
            <div className="col-xs-4">{key}</div>
            <div className="col-xs-4">{Math.min(this.state.diagnosisResult[this.state.curSeriesIndex][key].firstSlice, this.state.diagnosisResult[this.state.curSeriesIndex][key].lastSlice)
              + ' - ' + Math.max(this.state.diagnosisResult[this.state.curSeriesIndex][key].firstSlice, this.state.diagnosisResult[this.state.curSeriesIndex][key].lastSlice)}</div>
            <div className="col-xs-4" style={style.diagnosisProb}>{this.state.diagnosisResult[this.state.curSeriesIndex][key].prob * 100 + '%'}</div>
          </div>
        );
      }
    }


    let config = cornerstoneTools.magnify.getConfiguration();

    let rotatePopover = (
      <Popover id="rotate-popover" className="popover-positioned-bottom">
        <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.flipViewport('HORIZONTAL')}>
          <div style={{ paddingBottom: '5px' }}>
            <FontAwesome name='arrows-h' size='2x' />
          </div>
          <span>水平翻转</span>
        </div>
        <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.flipViewport('VERTICAL')}>
          <div style={{ paddingBottom: '5px' }}>
            <FontAwesome name='arrows-v' size='2x' />
          </div>
          <span>垂直翻转</span>
        </div>
        <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.rotateViewport('COUNTERCLOCKWISE')}>
          <div style={{ paddingBottom: '5px' }}>
            <FontAwesome name='rotate-left' size='2x' />
          </div>
          <span>向左旋转</span>
        </div>
        <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.rotateViewport('CLOCKWISE')}>
          <div style={{ paddingBottom: '5px' }}>
            <FontAwesome name='rotate-right' size='2x' />
          </div>
          <span>向右旋转</span>
        </div>
      </Popover>
    );

    let magnifyPopover = (
      <Popover id="magnify-popover" className="popover-positioned-bottom">
        <div style={{ marginBottom: '5px', textAlign: 'center' }}>倍数</div>
        <input id="magLevelRange" type="range" min="1" defaultValue={config.magnificationLevel} max="10" onChange={(evt) => {
          let config = cornerstoneTools.magnify.getConfiguration();
          config.magnificationLevel = parseInt(evt.target.value, 10);
        }} />
        <br />
        <div style={{ marginBottom: '5px', textAlign: 'center' }}>尺寸</div>
        <input id="magSizeRange" type="range" min="100" defaultValue={config.magnifySize} max="300" step="25" onChange={(evt) => {
          let config = cornerstoneTools.magnify.getConfiguration();
          config.magnifySize = parseInt(evt.target.value, 10)
          var magnify = document.getElementsByClassName("magnifyTool")[0];
          magnify.width = config.magnifySize;
          magnify.height = config.magnifySize;

        }} />
      </Popover>
    );

    let rotateCaret = this.getCaret(this.state.isRotateMenuOpened),
      magnifyCaret = this.getCaret(this.state.isMagnifyToolOpened);

    let diagnosisBox = this.state.isDiagnosisPanelOpened ? (
      this.state.isLoadingPanelFinished ? (
        <div>
          <div style={style.diagnosisHeader}>
            <h3>病变列表</h3>
          </div>
          <hr style={{ borderColor: '#aaf7f4' }} />
          <div className="row" style={{ ...style.diagnosisRow, ...style.diagnosisTableHead }}>
            <div className="col-xs-4">编号</div>
            <div className="col-xs-4">层面</div>
            <div className="col-xs-4" style={style.diagnosisProb}>概率</div>
          </div>
          {results}
        </div>
      ) : (
          <ReactSVG
            path="/img/spinner.svg"
            style={{ zIndex: 2000, width: '100%', margin: '0 auto' }}
          />
        )
    ) : undefined;

    let thumbnailBox = !this.state.isDiagnosisPanelOpened ? (
      this.state.seriesList.length > 0 ? (
        this.state.seriesList.map((series, index) => {
          return (
            <div key={'thumbnail' + index} onClick={() => { this.switchSeries(index) }}>
              <div className={"thumbnail-container " + (this.state.curSeriesIndex === index ? 'active-thumbnail' : '')}>
                <div className="thumbnailDiv" id={'thumbnail' + index} />
              </div>
              <div className="thumbnail-info row">
                <div className="col-sm-8">
                  {this.state.seriesList[index].seriesDescription}
                </div>
                <div className="col-sm-4" style={{ textAlign: 'center', color: '#91b9cd' }}>
                  <div><b style={{ color: '#4da2f2' }}>S</b>{' ' + this.state.seriesList[index].seriesNumber}</div>
                  <div><FontAwesome name='ellipsis-v' size='lg' /></div>
                  <div><FontAwesome name='file-image-o' size='lg' />{' ' + this.state.seriesList[index].total}</div>
                </div>
              </div>
            </div>
          )
        })
      ) : (
          <ReactSVG
            path="/img/spinner.svg"
            style={{ zIndex: 2000, width: '100%', margin: '0 auto' }}
          />
        )
    ) : undefined;

    return (
      <div id="body" style={style.body}>
        <div id="top" style={style.top}>
          <Navbar inverse collapseOnSelect style={{ marginBottom: '0' }}>
            <Navbar.Collapse style={{ minWidth: '1300px' }}>
              <Nav onSelect={(selectedKey) => this.navSelectHandler(selectedKey)}>
                <NavItem eventKey={1} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='adjust' size='2x' />
                  </div>
                  <span>窗宽窗位</span>
                </NavItem>
                <NavItem eventKey={2} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='search' size='2x' />
                  </div>
                  <span>缩放</span>
                </NavItem>
                <NavItem eventKey={3} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='hand-paper-o' size='2x' />
                  </div>
                  <span>拖动</span>
                </NavItem>
              </Nav>
              <Navbar.Text className="button" onClick={() => this.invertViewport()}>
                <FontAwesome name='square' size='2x' />
                <br />
                <span>反色</span>
              </Navbar.Text>
              <Navbar.Text className="button">
                <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={rotatePopover} onClick={() => this.toggleRotatePopover()} onExited={() => this.toggleRotatePopover()}>
                  <span>
                    <FontAwesome name='cog' size='2x' />
                    <br />
                    <span>旋转{rotateCaret}</span>
                  </span>
                </OverlayTrigger>
              </Navbar.Text>
              <Navbar.Text className="button" onClick={this.resetViewport.bind(this)}>
                <FontAwesome name='refresh' size='2x' /><br />
                <span>重置</span>
              </Navbar.Text>
              <Navbar.Text style={{ borderLeft: '2px solid #9ccef9', height: '50px' }}></Navbar.Text>
              <Nav onSelect={(selectedKey) => this.navSelectHandler(selectedKey)}>
                <NavItem eventKey={10} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='arrow-up' size='2x' />
                  </div>
                  <span>标注</span>
                </NavItem>
                <NavItem eventKey={4} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='arrows-h' size='2x' />
                  </div>
                  <span>测量</span>
                </NavItem>
                <NavItem eventKey={5} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='square-o' size='2x' />
                  </div>
                  <span>矩形</span>
                </NavItem>
                <NavItem eventKey={6} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='circle-o' size='2x' />
                  </div>
                  <span>圆点</span>
                </NavItem>
                <NavItem eventKey={7} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='chevron-down' size='2x' />
                  </div>
                  <span>角度</span>
                </NavItem>
                <NavItem eventKey={8} href="#">
                  <div style={style.icon}>
                    <FontAwesome name='sun-o' size='2x' />
                  </div>
                  <span>高亮</span>
                </NavItem>
                <NavItem eventKey={9} href="#">
                  <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={magnifyPopover} onClick={() => this.toggleMagnifyPopover()} onExited={() => this.toggleMagnifyPopover()}>
                    <div>
                      <div style={style.icon}>
                        <FontAwesome name='search-plus' size='2x' />
                      </div>
                      <span>放大{magnifyCaret}</span>
                    </div>
                  </OverlayTrigger>
                </NavItem>
              </Nav>
              <Navbar.Text className="button" onClick={() => this.clearToolData()}>
                <FontAwesome name='trash' size='2x' />
                <br />
                <span>清除</span>
              </Navbar.Text>
              <Navbar.Text style={{ borderLeft: '2px solid #9ccef9', height: '50px' }}></Navbar.Text>
              <Navbar.Text className="button" onClick={this.saveState.bind(this)}>
                <FontAwesome name='save' size='2x' />
                <br />
                <span>保存</span>
              </Navbar.Text>
              <Navbar.Text className="button" onClick={this.restoreState.bind(this)}>
                <FontAwesome name='paste' size='2x' />
                <br />
                <span>载入</span>
              </Navbar.Text>
              <Navbar.Text className="button" onClick={this.switchState.bind(this)}>
                <FontAwesome name={this.state.circleVisible ? 'eye-slash' : 'eye'} size='2x' />
                <br />
                <span>{this.state.circleVisible ? '隐藏' : '展示'}</span>
              </Navbar.Text>
              <Navbar.Text className="button" onClick={browserHistory.goBack}>
                <FontAwesome name='reply' size='2x' />
                <br />
                <span>返回</span>
              </Navbar.Text>
            </Navbar.Collapse>
          </Navbar>
        </div>

        <div className="left-panel">
          <LeftPanel />
        </div>

        <div className="main-canvas">
          <MainCanvas caseId={this.props.location.state.caseId} curSeriesIndex={this.props.location.state.index ? this.props.location.state.index : 0} />
        </div>


        {/*
        <div id="diagnosisInfo" style={{ ...style.diagnosisBox, ...{ height: this.state.containerHeight } }}>
          <ButtonGroup className="btn-panel-controller" justified>
            <Button active={this.state.diagnosisButton === 'default'} bsSize="large" onClick={this.switchPanelState.bind(this, 0)} href="#" >结节列表</Button>
            <Button active={this.state.thumbnailButton === 'default'} bsSize="large" onClick={this.switchPanelState.bind(this, 1)} href="#" >序列列表</Button>
          </ButtonGroup>
          {diagnosisBox}
          {thumbnailBox}
        </div>

        <div id="outerContainer" style={{ ...style.container, ...{ height: this.state.containerHeight, width: '80%' } }} className="container">
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
                <span>病人姓名: {this.state.patientName}</span>
                <br />
                <span>检查号: {this.state.patientId}</span>
              </div>
            </div>
            <div style={{ ...style.dicomInfo, ...style.textInfo, ...style.disableSelection }} id="dicomInfo">
              <span className="pull-right">窗宽/窗位: {this.state.voi.windowWidth}/{this.state.voi.windowCenter}</span>
              <br />
              <span className="pull-right">缩放: {this.state.zoomScale}</span>
            </div>
            <div style={{ ...style.sliceInfo, ...style.textInfo, ...style.disableSelection }} id="sliceInfo">
              <span className="pull-left">图像大小: {this.state.rows}*{this.state.cols}</span>
              <br />
              <span className="pull-left">层数: {this.state.index}/{this.state.imageNumber}</span>
              <br />
              <span className="pull-left">层厚: {this.state.thickness} mm</span>
              <br />
              <span className="pull-left">像素间距: {this.state.pixelSpacing} </span>

            </div>
            <div style={{ ...style.timeInfo, ...style.textInfo, ...style.disableSelection }} id="timeInfo">
              <span className="pull-right">{this.state.dateTime}</span>
            </div>
          </div>
        </div>
        */
        }

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
Meteor.subscribe('cases');
