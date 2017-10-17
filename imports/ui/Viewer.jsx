import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Button, Navbar, NavItem, Nav, NavDropdown, MenuItem, Jumbotron } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import dicomParse from 'dicom-parser';
import FS from 'fs'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
const style = {
  top: {
    height: '50px',
    backgroundColor: '#7f7f7f',
    width: '100%',
    position: 'relative',
    left: '0px',
  },
  bottom: {
    position: 'relative',
    width: '100%',
    bottom: '0px',
    left: '0px',
    height: '100px',
    backgroundColor: '#7f7f7f'
  },
  container: {
    // top: '100px',
    height: '70%',
    position: 'relative',
    width: '100%',
    left: '0px',
  },
  viewer: {
    height: '512px',
    width: '512px',
    position: 'relative',
    backgroundColor: 'green'
  },
  patientInfo: {
    position: 'absolute',
    top: '0px',
    left: '0px',
    height: '100px',
    width: '100px',
    // backgroundColor: 'black'
  },
  dicomInfo: {
    position: 'absolute',
    top: '0px',
    right: '0px',
    height: '100px',
    width: '100px',
    // backgroundColor: 'orange'
  },
  number: {
    position: 'absolute',
    bottom: '0px',
    left: '0px',
    height: '100px',
    width: '100px',
    // backgroundColor: 'black'
  },
  timeInfo: {
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    height: '100px',
    width: '100px',
    // backgroundColor: 'orange'
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
        imageNumber:0

    };
    this.setSlice = this.setSlice.bind(this);
    this.increaseSlice = this.increaseSlice.bind(this);
    this.decreaseSlice = this.decreaseSlice.bind(this);
    this.setScrollTool = this.setScrollTool.bind(this);
    this.setWindowTool = this.setWindowTool.bind(this);
    this.setZoomTool = this.setZoomTool.bind(this);
    this.setDrawTool = this.setDrawTool.bind(this);
    this.disableAllTools = this.disableAllTools.bind(this);
  }

    /**
     * will run after elements rendered
     */
    componentDidMount() {

        this.setState({
            container: document.getElementById("viewer")
        }, (err, result) => {
            if (err) {
                console.log(err);
            }
            cornerstone.enable(document.getElementById("viewer"));
        });

        Meteor.call('prepareDicoms', this.props.location.query.caseId, (error, result) => {

            if (error) {
                console.log(error)
            } else {
                if (result.status == "SUCCESS") {
                    this.setState({
                        imageNumber:result.imageNumber
                    });
                    this.setSlice(this.state.index);
                }

            }
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
            cornerstone.displayImage(this.state.container, this.state.dicomObj[index])
          })
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
    return (
      <div id="body">
        <div style={style.top}>
          <Navbar inverse collapseOnSelect>
            <Navbar.Collapse>
              <Nav>
                <NavItem eventKey={1} href="#" onClick={this.setScrollTool}>scroll</NavItem>
                <NavItem eventKey={2} href="#" onClick={this.setWindowTool}>wl/wc</NavItem>
                <NavItem eventKey={3} href="#" onClick={this.setZoomTool}>zoom/pan</NavItem>
                <NavItem eventKey={4} href="#" onClick={this.setDrawTool}>draw</NavItem>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
        </div>
        <div style={style.container} className="container">
          <div className="col-xs-3 left-container">
          </div>
          <div className="col-xs-6 center-container">
            <div style={style.viewer} ref="viewerContainer" id="viewer" className="viewer" >
              <div style={style.patientInfo} id="patientInfo"></div>
              <div style={style.dicomInfo} id="dicomInfo"></div>
              <div style={style.number} id="number"></div>
              <div style={style.timeInfo} id="timeInfo"></div>
            </div>
          </div>
          <div className="col-xs-3 right-container"></div>
        </div>

        <div style={style.bottom} className="bottom"></div>
      </div>
    )
  }
}