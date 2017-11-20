import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';

import cornerstone from 'cornerstone-core';
import cornerstoneTools from '../library/cornerstoneTools';
import { _ } from 'underscore';
import { ToastContainer, toast } from 'react-toastify';


import { Cases } from '../api/cases';
import { Marks } from '../api/marks';

import './css/mainCanvas.css';

let style = {
  scrollBar: {

  },
};

export default class MainCanvas extends Component {
  constructor(props) {
    super(props);

    console.log(props);

    this.state = {
      curSeriesIndex: this.props.curSeriesIndex,
      index: 1,
      imageNumber: 0,
      dicomObj: {},
      voi: {
        windowCenter: 0,
        windowWidth: 0
      },
      controllerBtnClicked: undefined
    };

    this.updateInfo = this.updateInfo.bind(this);

  }

  componentDidMount() {
    /**
     * enable cornerstone and setup cornerstoneTools
     */
    this.setState({
      container: document.getElementById("viewer"),
      containerHeight: (window.innerHeight - document.getElementById('top').clientHeight) - 50,
      topValue: (window.innerHeight - document.getElementById('top').clientHeight) / 2 - 8,
      rightValue: -((window.innerHeight - document.getElementById('top').clientHeight) / 2 - 40)
    }, (err) => {
      if (err) {
        return console.error(err);
      }

      cornerstone.enable(this.state.container);
      cornerstoneTools.addStackStateManager(this.state.container, 'stack');
      cornerstoneTools.toolColors.setToolColor("#ffcc33");
    });

    /**
     * default configuration for magnify tool
     */
    let config = {
      magnifySize: 250,
      magnificationLevel: 4
    };
    cornerstoneTools.magnify.setConfiguration(config);

    /**
     * send a request to require server load all cases first
     */
    this.initMainCanvas(this.props.caseId, this.state.curSeriesIndex);

    /**
     * set scroll tool for default mousewheel operation
     */
    this.setScrollTool();

    /**
     * re-render when window resized
     */
    window.addEventListener('resize', () => this.updateDimensions());

    /**
     * disable right click in canvas
     */
    document.getElementById('viewer').oncontextmenu = function (e) {
      e.preventDefault();
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({'controllerBtnClicked': nextProps.controllerBtnClicked}, this.onControllerBtnClicked);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", () => this.updateDimensions());
  }

  /**
   * initialize main canvas
   * @param caseId
   * @param seriesIndex
   */
  initMainCanvas(caseId, seriesIndex) {
    Meteor.call('prepareDicoms', caseId, seriesIndex, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        if (result.status === "SUCCESS") {
          let dateTime = ''
          if(result.seriesTime && result.seriesDate){
            let timeStr = result.seriesTime.substring(0, 6).match(/^(\d{2})(\d{1,2})(\d{1,2})$/);
            dateTime = `${result.seriesDate.substring(0, 4)}-${result.seriesDate.substring(4, 6)}-${result.seriesDate.substring(6, 8)} ${timeStr[1]}:${timeStr[2]}:${timeStr[3]}`
          }
          this.setState({
            imageNumber: result.imageNumber,
            patientId: result.patientId,
            patientName: result.patientName,
            dateTime: dateTime,
            rows: result.rows,
            cols: result.cols,
            pixelSpacing: result.pixelSpacing,
            thickness: result.thickness,
            index: 1,
            loadingProgress: 0
          });
          this.setSlice(seriesIndex, this.state.index);
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
   * updates window dimensions
   */
  updateDimensions() {
    cornerstone.resize(this.state.container, false);
  }

  /**
   * set image slice
   * @param curSeriesIndex
   * @param index image index
   */
  setSlice(curSeriesIndex, index) {
    if (!this.state.dicomObj[curSeriesIndex]) {
      let tempObj = Object.assign({}, this.state.dicomObj);
      tempObj[curSeriesIndex] = {};
      this.setState({
        dicomObj: tempObj
      });
    }

    if (!this.state.dicomObj[curSeriesIndex][index]) {
      Meteor.call('getDicom', curSeriesIndex, index, (err, result) => {
        if (err) {
          return console.error(err);
        }

        let image = result;
        let pixelData = new Uint16Array(image.imageBuf.buffer, image.pixelDataOffset, image.pixelDataLength / 2);
        image.getPixelData = function () {
          return pixelData
        };
        this.state.dicomObj[curSeriesIndex][index] = image;

        var viewport = {};
        if (index === 1) {
          viewport.scale = 1.2;
        }
        cornerstone.displayImage(this.state.container, this.state.dicomObj[curSeriesIndex][index], viewport);

        let measurementData = {
          currentImageIdIndex: this.state.index,
          imageIds: image.imageId
        };

        cornerstoneTools.addToolState(this.state.container, 'stack', measurementData);
        if (!this.state.imageLoaded) {
          this.disableAllTools();
          this.state.imageLoaded = true;
        }
      });
    } else {
      cornerstone.displayImage(this.state.container, this.state.dicomObj[curSeriesIndex][index])
    }
    let scrollbar = document.getElementById("scrollbar");
    scrollbar.value = index;
    this.setState({
      index: index
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
   * activate scroll tool, enable both mousewheel and mouse select
   */
  setScrollTool() {
    let self = this;
    $("#viewer").bind("mousewheel", function (e) {
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
   * handler for draging the scroll bar, moves scrollbar position and changes image
   * @param evt mousemove event
   */
  onDragScrollBar() {
    let scrollbar = document.getElementById("scrollbar");
    this.setSlice(this.state.curSeriesIndex, parseInt(scrollbar.value));
  }

  onControllerBtnClicked() {
    let btnType = this.state.controllerBtnClicked;

    switch (btnType) {
      case 'WINDOW':
        this.setWindowTool();
        break;

      case 'ZOOM':
        this.setZoomTool();
        break;

      case 'PAN':
        this.setPanTool();
        break;

      case 'LENGTH':
        this.setLengthTool();
        break;

      case 'RECTANGLE':
        this.setRectangleTool();
        break;

      case 'PROBE':
        this.setProbeTool();
        break;

      case 'ANGLE':
        this.setAngleTool();
        break;

      case 'HIGHLIGHT':
        this.setHighlightTool();
        break;

      case 'MAGNIFY':
        this.setMagnifyTool();
        break;

      case 'ANNOTATION':
        this.setAnnotationTool();
        break;

      case 'INVERT':
        this.invertViewport();
        break;

      case 'FLIP_H':
        this.flipViewport('HORIZONTAL');
        break;

      case 'FLIP_V':
        this.flipViewport('VERTICAL');
        break;

      case 'ROTATE_CLOCKWISE':
        this.rotateViewport('CLOCKWISE');
        break;

      case 'ROTATE_COUNTERCLOCKWISE':
        this.rotateViewport('COUNTERCLOCKWISE');
        break;

      case 'RESET':
        this.resetViewport();
        break;

      case 'CLEAR':
        this.clearToolData();
        break;

      case 'SAVE':
        this.saveState();
        break;

      case 'RESTORE':
        this.restoreState();
        break;

      case 'SWITCH':
        this.switchState();
        break;

      default:
        if(btnType !== undefined) {
          console.error('Error - No matched key for ' + btnType);
        }
        break;
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
   * activate length tool
   */
  setLengthTool() {
    this.disableAllTools();
    cornerstoneTools.length.activate(this.state.container, 1);
  }

  /**
   * activate rectangle draw function
   */
  setRectangleTool() {
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

  /**
   * activate magnify tool
   */
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

    let caseInfo = Cases.findOne({ _id: this.props.caseId });
    let seriesInstanceUID = caseInfo.seriesList[this.state.curSeriesIndex].seriesInstanceUID

    let mark = {
      imageIdToolState: appState.imageIdToolState,
      elementToolState: appState.elementToolState,
      elementViewport: appState.elementViewport,
      source: 'USER',
      createAt: new Date(),
      caseId: this.props.caseId,
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
    let caseInfo = Cases.findOne({ _id: this.props.caseId });
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
   * disable tools
   */
  disableAllTools(tag) {
    let element = $("#viewer");

    element.off("mousewheel");

    if (tag !== 'ZOOM') {
      this.setScrollTool();
    }

    element.off("mousemove");
    cornerstoneTools.mouseInput.enable(this.state.container);
    cornerstoneTools.mouseWheelInput.enable(this.state.container);
    cornerstoneTools.rectangleRoi.deactivate(this.state.container, 1);
    cornerstoneTools.wwwc.deactivate(this.state.container, 1);
    cornerstoneTools.pan.deactivate(this.state.container, 1);
    cornerstoneTools.zoom.deactivate(this.state.container, 1);
    cornerstoneTools.zoomWheel.deactivate(this.state.container);
    cornerstoneTools.length.deactivate(this.state.container, 1);
    cornerstoneTools.probe.deactivate(this.state.container, 1);
    cornerstoneTools.angle.deactivate(this.state.container, 1);
    cornerstoneTools.highlight.disable(this.state.container, 1);
    cornerstoneTools.magnify.deactivate(this.state.container, 1);
    cornerstoneTools.arrowAnnotate.deactivate(this.state.container, 1);
  }

  render() {
    return (
      <div style={{height: '100%'}} id="outer-container">
        <input type="range"
          id="scrollbar"
          min={1}
          max={this.state.imageNumber}
          step={1}
          onChange={() => this.onDragScrollBar()}
          style={{
            ...{ width: this.state.containerHeight },
            ...{ top: this.state.topValue },
            ...{ right: this.state.rightValue }
          }}
        />
        <div style={style.viewer} ref="viewerContainer" id="viewer" >
          <div className="text-info disable-selection patient-info" id="patientInfo">
            <div>
              <span>病人姓名: {this.state.patientName}</span>
              <br />
              <span>检查号: {this.state.patientId}</span>
            </div>
          </div>
          <div className="text-info disable-selection dicom-info" id="dicomInfo">
            <span className="pull-right">窗宽/窗位: {this.state.voi.windowWidth}/{this.state.voi.windowCenter}</span>
            <br />
            <span className="pull-right">缩放: {this.state.zoomScale}</span>
          </div>
          <div className="text-info disable-selection slice-info" id="sliceInfo">
            <span className="pull-left">图像大小: {this.state.rows}*{this.state.cols}</span>
            <br />
            <span className="pull-left">层数: {this.state.index}/{this.state.imageNumber}</span>
            <br />
            <span className="pull-left">层厚: {this.state.thickness} mm</span>
            <br />
            <span className="pull-left">像素间距: {this.state.pixelSpacing} </span>
          </div>
          <div className="text-info disable-selection time-info" id="timeInfo">
            <span className="pull-right">{this.state.dateTime}</span>
          </div>
        </div>
      </div>
    );
  }
}
