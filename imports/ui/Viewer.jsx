import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Button, Col, Navbar, NavItem, Nav, NavDropdown, MenuItem, Jumbotron } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import dicomParse from 'dicom-parser';
import FS from 'fs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import FontAwesome from 'react-fontawesome';


const style = {
    body: {
        backgroundColor: 'black',
        minHeight: '100%'
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
        position: 'relative',
        width: '100%',
        left: '0px',
        border: '1px solid #42f4ee'
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
        width: '100px',
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
      width:'10px',
      height: '40px',
      backgroundColor: '#9ccef9',
      position: 'absolute',
      right: '0',
      top: '0',
      borderRadius: '4px'
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
            index:1,
            imageNumber:0,
            zoomScale: 0,
            voi: {
              windowCenter: 0,
              windowWidth: 0
            },
            dateTime: new Date().toLocaleString()

        };
        this.setSlice = this.setSlice.bind(this);
        this.increaseSlice = this.increaseSlice.bind(this);
        this.decreaseSlice = this.decreaseSlice.bind(this);
        this.setScrollTool = this.setScrollTool.bind(this);
        this.setWindowTool = this.setWindowTool.bind(this);
        this.setZoomTool = this.setZoomTool.bind(this);
        this.setDrawTool = this.setDrawTool.bind(this);
        this.resetViewport = this.resetViewport.bind(this);
        this.disableAllTools = this.disableAllTools.bind(this);
        this.updateInfo = this.updateInfo.bind(this);
    }

    /**
     * will run after elements rendered
     */
    componentDidMount() {

        /**
         * set the dynamic height for container
         */
        this.setState({
            containerHeight: (window.innerHeight - document.getElementById('top').clientHeight) + 'px'
        });

        this.setState({
            container: document.getElementById("viewer")
        }, (err) => {
            if (err) {
              return console.log(err);
            }

            cornerstone.enable(document.getElementById("viewer"));
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
                if (result.status == "SUCCESS") {
                    this.setState({
                        imageNumber:result.imageNumber,
                        patientId : result.patientId,
                        patientName: result.patientName
                    });
                    this.setSlice(this.state.index);
                    //set info here
                    let element = $("#viewer");
                    element.on("CornerstoneImageRendered", this.updateInfo);
                }

            }
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
     * increase slice number
     */
    increaseSlice(){
        if (this.state.index < this.state.imageNumber) {
            this.setState({
                index:this.state.index + 1
            });
            this.setSlice(this.state.index);
        }
    }

    /**
     * decrease slice number
     */
    decreaseSlice(){
        if (this.state.index > 1) {
            this.setState({
                index:this.state.index - 1
            });
            this.setSlice(this.state.index);
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
            image.getPixelData = function(){
              return pixelData
            };
            let currentObj = this.state.dicomObj
            currentObj[index] = image
            this.setState({
              dicomObj: currentObj
            });

            var viewport = {};
            if(index === 1) {
              viewport.scale = 1.0;
            }
            cornerstone.displayImage(this.state.container, this.state.dicomObj[index], viewport);
          });
        } else {
            cornerstone.displayImage(this.state.container, this.state.dicomObj[index])
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
            let up = event.wheelDelta > 0;
            if (up) {
                self.increaseSlice();
            } else {
                self.decreaseSlice();
            }
        });
        let step = element.height() / this.state.imageNumber;
        let startPoint = 0;
        element.mousemove(function (e) {
            if (e.which == 1) {
                if (e.pageY - startPoint > step) {
                    self.increaseSlice();
                    startPoint = e.pageY;
                } else if (e.pageY - startPoint < -step) {
                    self.decreaseSlice();
                    startPoint = e.pageY;
                }
            }
        });
    }

    /**
     * activate window width and window level function
     */
    setWindowTool() {
        this.disableAllTools();
        cornerstoneTools.wwwc.activate(this.state.container,1);
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
    cornerstoneTools.pan.activate(element,1);
    cornerstoneTools.zoom.activate(element,4);
    cornerstoneTools.zoomWheel.activate(element);
  }

    /**
     * activate rectangle draw function
     */
    setDrawTool() {
        this.disableAllTools();
        cornerstoneTools.rectangleRoi.activate(this.state.container, 1);
    }

    /**
     * reset viewport to default state
     */
    resetViewport() {
      let canvas = $('#viewer canvas').get(0);
      let enabledElement = cornerstone.getEnabledElement(this.state.container);
      let viewport = cornerstone.getDefaultViewport(canvas, enabledElement.image);
      viewport.scale = 1.0;
      cornerstone.setViewport(this.state.container, viewport);
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
        cornerstoneTools.rectangleRoi.deactivate(this.state.container,1);
        cornerstoneTools.wwwc.deactivate(this.state.container,1);
        cornerstoneTools.pan.deactivate(this.state.container,1);
        cornerstoneTools.zoom.deactivate(this.state.container,4);
        cornerstoneTools.zoomWheel.deactivate(this.state.container);
    }

  render() {
    // style={{color: '#9ccef9'}}
    return (
      <div id="body" style={style.body}>
        <div id="top" style={style.top}>
          <Navbar inverse collapseOnSelect style={{marginBottom: '0'}}>
            <Navbar.Collapse>
              <Nav>
                <NavItem eventKey={1} href="#" onClick={this.setScrollTool}>
                  <div>
                    <div>
                      <FontAwesome name='gear' size='2x'/>
                    </div>
                    <span>scroll</span>
                  </div>
                </NavItem>
                <NavItem eventKey={2} href="#" onClick={this.setWindowTool}>
                  <div>
                    <FontAwesome name='adjust' size='2x'/>
                  </div>
                  <span>wl/wc</span>
                </NavItem>
                <NavItem eventKey={3} href="#" onClick={this.setZoomTool}>
                  <div>
                    <FontAwesome name='search' size='2x'/>
                  </div>
                  <span>zoom/pan</span>
                </NavItem>
                <NavItem eventKey={4} href="#" onClick={this.setDrawTool}>
                  <div>
                    <FontAwesome name='square-o' size='2x'/>
                  </div>
                  <span>draw</span>
                </NavItem>
                <NavItem eventKey={5} href="#" onClick={this.resetViewport}>
                  <div>
                    <FontAwesome name='refresh' size='2x'/>
                  </div>
                  <span>reset</span>
                </NavItem>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        </div>
        <div style={{...style.container, ...{height: this.state.containerHeight}}} className="container">
          <div style={style.scrollBar} onMouseDown={(e)=>console.log(e)}></div>
          <div style={style.viewer} ref="viewerContainer" id="viewer" >
            <div style={{...style.patientInfo, ...style.textInfo}} id="patientInfo">
              <div>
                <span>Patient name: {this.state.patientName}</span>
                <br/>
                <span>Patient id: {this.state.patientId}</span>
              </div>
            </div>
            <div style={{...style.dicomInfo, ...style.textInfo}} id="dicomInfo">
              <span className="pull-right">WW/WC: {this.state.voi.windowWidth}/{this.state.voi.windowCenter}</span>
              <br/>
              <span className="pull-right">Zoom: {this.state.zoomScale}</span>
            </div>
            <div style={{...style.sliceInfo, ...style.textInfo}} id="sliceInfo">
              <span style={{position: 'absolute', bottom: '10px'}}>{this.state.index}/{this.state.imageNumber}</span>
            </div>
            <div style={{...style.timeInfo, ...style.textInfo}} id="timeInfo">
              <span className="pull-right">{this.state.dateTime}</span>
            </div>
          </div>
        </div>

        <div style={style.bottom}></div>
      </div>
    )
  }
}
