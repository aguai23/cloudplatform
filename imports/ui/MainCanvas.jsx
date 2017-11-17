import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';

import cornerstone from 'cornerstone-core';
import cornerstoneTools from '../library/cornerstoneTools';

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
      }
    }
  }

  componentDidMount() {
    /**
     * enable cornerstone and setup cornerstoneTools
     */
    this.setState({
      container: document.getElementById("viewer")
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

  toggleMagnifyPopover() {
    this.setState({ isMagnifyToolOpened: !this.state.isMagnifyToolOpened });
  }

  toggleRotatePopover() {
    this.setState({ isRotateMenuOpened: !this.state.isRotateMenuOpened });
  }


  render() {
    return (
      <div style={{height: '100%'}}>
        <input type="range"
          id="scrollbar"
          min={1}
          max={this.state.imageNumber}
          step={1}
          onInput={this.onDragScrollBar}
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
