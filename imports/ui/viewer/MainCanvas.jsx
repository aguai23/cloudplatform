import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';

import cornerstone from 'cornerstone-core';
import cornerstoneTools from '../../library/cornerstoneTools';
import { _ } from 'underscore';
import h337 from 'heatmap.js';
import CustomEventEmitter from '../../library/CustomEventEmitter';
import AutoCacheManager from './AutoCacheManager';
import LoadingScene from './LoadingScene';

import { Cases } from '../../api/cases';
import { Marks } from '../../api/marks';

import './css/mainCanvas.css';
const customEventEmitter = new CustomEventEmitter()

export default class MainCanvas extends Component {
  constructor(props) {
    super(props);

    this.dicomObj = {};
    this.displayInfo = {};
    this.imageNumber = 0;
    this.index = 1;
    this.caseId = this.props.caseId;
    this.curSeriesNumber = this.props.seriesNumber;
    this.nextImageToCache = 1;

    this.state = {
      isLoading: false,
      voi: {
        windowCenter: 0,
        windowWidth: 0
      }
    };

    customEventEmitter.subscribe('changeSeries', (data) => {
      this.curSeriesNumber = data.seriesNumber;
      this.initMainCanvas(data.caseId, data.seriesNumber);
    });
    customEventEmitter.subscribe('diagnosisResult', (data) => {
      cornerstoneTools.ellipticalRoi.enable(this.container, 1);
      let caseId = this.caseId;
      let elements = [document.getElementById('viewer')];
      let currentState = cornerstoneTools.appState.save(elements);
      let result = JSON.parse(data.result);
      let seriesNumber = data.seriesNumber;
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
    })
    customEventEmitter.subscribe('setSlice', (data) => {
      this.setSlice(this.caseId, this.curSeriesNumber, data)
    });
  }

  componentDidMount() {
    this.container = document.getElementById('viewer');

    /**
     * set scrollbar position
     */
    this.containerHeight = (window.innerHeight - document.getElementById('top').clientHeight) - 50;
    this.topValue = (window.innerHeight - document.getElementById('top').clientHeight) / 2 - 8;
    this.rightValue = -(window.innerHeight - document.getElementById('top').clientHeight) / 2 + 40;

    /**
     * enable cornerstone and setup cornerstoneTools
     */
    cornerstone.enable(this.container);
    cornerstoneTools.addStackStateManager(this.container, 'stack');
    cornerstoneTools.toolColors.setToolColor("#ffcc33");

    /**
     * default configuration for magnify tool
     */
    let config = {
      magnifySize: 250,
      magnificationLevel: 4
    };
    cornerstoneTools.magnify.setConfiguration(config);

    let caseInstance = Cases.findOne({ _id: this.caseId });
    this.cacheManager = new AutoCacheManager(caseInstance.seriesList);

    /**
     * send a request to require server load all cases first
     */
    this.initMainCanvas(this.caseId, this.props.seriesNumber);

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
    // this.renderHeatMap()
  }

  componentWillReceiveProps(nextProps) {
    if(Object.keys(nextProps.canvasParams).length === 0 && nextProps.canvasParams.constructor === Object) {
      return;
    }

    if(nextProps.canvasParams.windowParams) {
      let viewport = cornerstone.getViewport(this.container);
      this.setWindowParams(nextProps.canvasParams.windowParams.ww, nextProps.canvasParams.windowParams.wl);
    } else if(nextProps.canvasParams.btnClicked) {
      this.onControllerBtnClicked(nextProps.canvasParams.btnClicked);
    }
    nextProps.callback();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', () => this.updateDimensions());
    window.clearInterval(this.cacheManager.autoCacheProcess);

    customEventEmitter.unsubscribe('changeSeries');
    customEventEmitter.unsubscribe('diagnosisResult');
    customEventEmitter.unsubscribe('setSlice');
  }

  /**
   * initialize main canvas
   * @param caseId
   * @param seriesIndex
   */
  initMainCanvas(caseId, seriesNumber) {
    Meteor.call('prepareDicoms', caseId, seriesNumber, (error, result) => {
      if (error) {
        console.error(error)
      } else {
        customEventEmitter.dispatch('loadThumbnails');

        let dateTime = ''
        if (result.seriesTime && result.seriesDate) {
          let timeStr = result.seriesTime.substring(0, 6).match(/^(\d{2})(\d{1,2})(\d{1,2})$/);
          dateTime = `${result.seriesDate.substring(0, 4)}-${result.seriesDate.substring(4, 6)}-${result.seriesDate.substring(6, 8)} ${timeStr[1]}:${timeStr[2]}:${timeStr[3]}`
        }

        this.imageNumber = result.imageNumber;
        this.index = 1;
        this.displayInfo = {
          patientId: result.patientId,
          patientName: result.patientName,
          dateTime: dateTime,
          rows: result.rows,
          cols: result.cols,
          pixelSpacing: result.pixelSpacing,
          thickness: result.thickness,
          index: 1
        };

        this.cacheManager.startAutoCacheSeries(caseId, seriesNumber, (image) => {
          let pixelData = this.setPixelData(image);

          image.getPixelData = function () {
            return pixelData
          };

          if(this.state.isLoading) {
            this.setState({
              isLoading: false
            });
          }

          this.dicomObj[seriesNumber][image.index] = image;
          customEventEmitter.dispatch('showSliceLoaded', {seriesNumber: seriesNumber, index: image.index});
        });

        this.setSlice(caseId, seriesNumber, this.index);

        $('#viewer').on('CornerstoneImageRendered', (e) => this.updateInfo(e));
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
        windowWidth: parseFloat(viewport.voi.windowWidth).toFixed(0),
        windowCenter: parseFloat(viewport.voi.windowCenter).toFixed(0)
      },
      zoomScale: parseFloat(viewport.scale).toFixed(2)
    });
  }

  /**
   * updates window dimensions
   */
  updateDimensions() {
    cornerstone.resize(this.container, false);
  }

  setPixelData(image) {
    let pixelData = undefined;
    /**
     * manipulate pixelData in different ways according how many bits allocated for each pixel
     */
    if (image.bitsAllocated === 8) {
      pixelData = new Uint16Array(image.pixelDataLength);

      for (let i = 0; i < image.pixelDataLength; i++) {
        pixelData[i] = image.imageBuf[image.pixelDataOffset + i];
      }
    } else if (image.bitsAllocated === 16) {
      pixelData = new Uint16Array(image.imageBuf.buffer, image.pixelDataOffset, image.pixelDataLength / 2);
    }

    return pixelData;
  }

  /**
   * set image slice
   * @param seriesNumber
   * @param index image index
   */
  setSlice(caseId, seriesNumber, index) {
    let scrollbar = document.getElementById("scrollbar");
    scrollbar.value = index;
    this.index = index;

    if (!this.dicomObj[seriesNumber]) {
      this.dicomObj[seriesNumber] = {};
    }

    if (!this.dicomObj[seriesNumber][index]) {
      this.setState({
        isLoading: true
      }, () => {
        this.cacheManager.cacheSlice(caseId, seriesNumber, index, (image) => {
          let pixelData = this.setPixelData(image);

          image.getPixelData = function () {
            return pixelData;
          }

          this.dicomObj[seriesNumber][index] = image;
          customEventEmitter.dispatch('showSliceLoaded', {seriesNumber: seriesNumber, index: image.index});

          /**
           * set viewport scale when loading first slice
            */
          var viewport = {};
          if (index === 1) {
            viewport.scale = (600 / image.width).toFixed(2);

            if(image.photometricInterpretation === 'MONOCHROME1') {
              viewport.invert = true;
            }
          }

          this.setState({
            isLoading: false
          }, () => {
            cornerstone.displayImage(this.container, image, viewport);
          });

          let measurementData = {
            currentImageIdIndex: this.index,
            imageIds: image.imageId
          };

          cornerstoneTools.addToolState(this.container, 'stack', measurementData);
          if (!this.imageLoaded) {
            this.disableAllTools();
            this.imageLoaded = true;
          }
        });
      });
    } else {
      cornerstone.displayImage(this.container, this.dicomObj[seriesNumber][index]);
    }

  }

  /**
   * increase slice number
   */
  increaseSlice() {
    if (this.index < this.imageNumber) {
      this.setSlice(this.caseId, this.curSeriesNumber, this.index + 1);
    }
  }

  /**
   * decrease slice number
   */
  decreaseSlice() {
    if (this.index > 1) {
      this.setSlice(this.caseId, this.curSeriesNumber, this.index - 1);
    }
  }

  /**
   * activate scroll tool, enable both mousewheel and mouse select
   */
  setScrollTool() {
    let self = this;
    $("#viewer").bind("mousewheel", (e) => {
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
   */
  onDragScrollBar(e) {
    if(this.index != e.target.value) {
      this.setSlice(this.caseId, this.curSeriesNumber, parseInt(scrollbar.value));
    }
  }

  /**
   * set specific window width and window location for the image
   */
  setWindowParams(ww, wl) {
    let viewport = cornerstone.getViewport(this.container);
    viewport.voi.windowWidth = ww;
    viewport.voi.windowCenter = wl;
    cornerstone.setViewport(this.container, viewport);
  }

  /**
   * handler for manipulating request from controller
   */
  onControllerBtnClicked(btnType) {
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
        if (btnType !== undefined) {
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
    cornerstoneTools.wwwc.activate(this.container, 1);
  }

  /**
   * activate zoom and pan function
   */
  setZoomTool() {
    this.disableAllTools('ZOOM');

    var config = {
      // invert: true,
      minScale: 0.1,
      maxScale: 20.0,
      preventZoomOutsideImage: true
    };
    cornerstoneTools.zoom.setConfiguration(config);

    let element = this.container;
    cornerstoneTools.zoom.activate(element, 1);
    cornerstoneTools.zoomWheel.activate(element);
  }

  /**
   * activate pan function
   */
  setPanTool() {
    this.disableAllTools();
    cornerstoneTools.pan.activate(this.container, 1);
  }

  /**
   * activate length tool
   */
  setLengthTool() {
    this.disableAllTools();
    cornerstoneTools.length.activate(this.container, 1);
  }

  /**
   * activate rectangle draw function
   */
  setRectangleTool() {
    this.disableAllTools();
    cornerstoneTools.rectangleRoi.activate(this.container, 1);
  }

  /**
   * active annotation tool
   */
  setAnnotationTool() {
    this.disableAllTools();
    cornerstoneTools.arrowAnnotate.activate(this.container, 1);
  }

  /**
   * activate probe tool
   */
  setProbeTool() {
    this.disableAllTools();
    cornerstoneTools.probe.activate(this.container, 1);
  }

  /**
   * activate angle tool
   */
  setAngleTool() {
    this.disableAllTools();
    cornerstoneTools.angle.activate(this.container, 1);
  }

  /**
   * activate hightlight tool
   */
  setHighlightTool() {
    this.disableAllTools();
    cornerstoneTools.highlight.activate(this.container, 1);
  }

  /**
   * activate magnify tool
   */
  setMagnifyTool() {
    this.disableAllTools();
    cornerstoneTools.magnify.activate(this.container, 1);
  }

  /**
   * invert viewport
   */
  invertViewport() {
    let viewport = cornerstone.getViewport(this.container);
    viewport.invert = !viewport.invert;
    cornerstone.setViewport(this.container, viewport);
  }

  /**
   * save mark to database
   */
  saveState() {
    let elements = [this.container];
    let currentState = cornerstoneTools.appState.save(elements);
    let appState = JSON.parse(JSON.stringify(currentState));

    _.mapObject(appState.imageIdToolState, (val, imageId) => {
      _.mapObject(val, (data, toolName) => {
        if (toolName === 'ellipticalRoi') {
          appState.imageIdToolState[imageId].ellipticalRoi.data = []
        }
      })
    });

    let caseInstance = Cases.findOne({ _id: this.caseId });

    let index = 0;
    while(index < caseInstance.seriesList.length) {
      if(caseInstance.seriesList[index].seriesNumber === this.curSeriesNumber) {
        break;
      }
      index++;
    }

    let seriesInstanceUID = caseInstance.seriesList[index].seriesInstanceUID

    let mark = {
      imageIdToolState: appState.imageIdToolState,
      elementToolState: appState.elementToolState,
      elementViewport: appState.elementViewport,
      source: 'USER',
      createAt: new Date(),
      caseId: this.caseId,
      seriesInstanceUID: seriesInstanceUID,
      ownerId: Meteor.userId() ? Meteor.userId() : 'tourist'
    };

    let oldState = Marks.findOne({ ownerId: Meteor.userId() ? Meteor.userId() : 'tourist', seriesInstanceUID: seriesInstanceUID });
    if (oldState) {
      mark._id = oldState._id;
      Meteor.call('modifyMark', mark, (error) => {
        if (error) {
          this.props.toastInfo('error', `标注保存失败,${error.reason}`)
          return console.error(error);
        } else {
          this.props.toastInfo('success', '标注保存成功!')
        }
      })
    } else {
      Meteor.call('insertMark', mark, (error) => {
        if (error) {
          this.props.toastInfo('error', `标注保存失败,${error.reason}`)
          return console.error(error);
        } else {
          this.props.toastInfo('success', '标注保存成功!')
        }
      })
    }
  }

  /**
   * reload mark from database
   */
  restoreState() {
    let elements = [this.container],
        currentState = cornerstoneTools.appState.save(elements),
        caseInstance = Cases.findOne({ _id: this.caseId });

    let index = 0;
    while(index < caseInstance.seriesList.length) {
      if(caseInstance.seriesList[index].seriesNumber === this.curSeriesNumber) {
        break;
      }
      index++;
    }

    let seriesInstanceUID = caseInstance.seriesList[index].seriesInstanceUID
    let oldState = Marks.findOne({ ownerId: Meteor.userId() ? Meteor.userId() : 'tourist', seriesInstanceUID: seriesInstanceUID });
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
      this.props.toastInfo('warning', '无历史标注!')
    }

  }

  /**
   * reset viewport to default state
   */
  resetViewport() {
    let canvas = $('#viewer canvas').get(0),
      enabledElement = cornerstone.getEnabledElement(this.container),
      viewport = cornerstone.getDefaultViewport(canvas, enabledElement.image),
      width = this.dicomObj[this.curSeriesNumber][this.index].width;

    viewport.scale = (600 / width).toFixed(2);
    cornerstone.setViewport(this.container, viewport);
  }

  renderHeatMap() {
    let config2 = {
      container: this.container,
      radius: 10,
      maxOpacity: .5,
      minOpacity: 0,
      blur: .75,
      gradient: {
        // enter n keys between 0 and 1 here
        // for gradient color customization
        '.5': 'blue',
        '.8': 'red',
        '.95': 'white'
      }
    };
    let heatmapInstance = h337.create(config2);
    let points = [];
    let max = 0;
    let width = 840;
    let height = 400;
    let len = 200;
    
    while (len--) {
      let val = Math.floor(Math.random()*100);
      max = Math.max(max, val);
      let point = {
        x: Math.floor(Math.random()*width),
        y: Math.floor(Math.random()*height),
        value: val
      };
      points.push(point);
    }
    // heatmap data format
    let data = { 
      max: max, 
      data: points 
    };
    // if you have a set of datapoints always use setData instead of addData
    // for data initialization
    heatmapInstance.setData(data);
  }

  /**
   * switch circle visible state
   */
  switchState() {
    if (this.circleVisible) {
      cornerstoneTools.ellipticalRoi.disable(this.container, 1);
      this.circleVisible = false;
    } else {
      cornerstoneTools.ellipticalRoi.enable(this.container, 1);
      this.circleVisible = true;
    }
  }

  /**
   * clear all tool data, e.g. rec, probe and angle
   */
  clearToolData() {
    let elements = [this.container];
    let currentState = cornerstoneTools.appState.save(elements);
    let element = cornerstone.getEnabledElement(this.container);
    let toolState = currentState.imageIdToolState;
    if (!toolState.hasOwnProperty(element.image.imageId)) {
      return;
    }

    for (let toolName in toolState[element.image.imageId]) {
      if (toolName !== 'ellipticalRoi') {
        delete toolState[element.image.imageId][toolName];
      }
    }

    cornerstone.updateImage(this.container);
  }

  /**
   * flip viewport
   */
  flipViewport(orientation) {
    let viewport = cornerstone.getViewport(this.container);

    if (orientation === 'HORIZONTAL') {
      viewport.hflip = !viewport.hflip;
    } else if (orientation === 'VERTICAL') {
      viewport.vflip = !viewport.vflip;
    }

    cornerstone.setViewport(this.container, viewport);
  }

  /**
   * rotate viewport
   */
  rotateViewport(orientation) {
    let viewport = cornerstone.getViewport(this.container);

    if (orientation === 'CLOCKWISE') {
      viewport.rotation += 90;
    } else if (orientation === 'COUNTERCLOCKWISE') {
      viewport.rotation -= 90;
    }

    cornerstone.setViewport(this.container, viewport);
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
    cornerstoneTools.mouseInput.enable(this.container);
    cornerstoneTools.mouseWheelInput.enable(this.container);
    cornerstoneTools.rectangleRoi.deactivate(this.container, 1);
    cornerstoneTools.wwwc.deactivate(this.container, 1);
    cornerstoneTools.pan.deactivate(this.container, 1);
    cornerstoneTools.zoom.deactivate(this.container, 1);
    cornerstoneTools.zoomWheel.deactivate(this.container);
    cornerstoneTools.length.deactivate(this.container, 1);
    cornerstoneTools.probe.deactivate(this.container, 1);
    cornerstoneTools.angle.deactivate(this.container, 1);
    cornerstoneTools.highlight.disable(this.container, 1);
    cornerstoneTools.magnify.deactivate(this.container, 1);
    cornerstoneTools.arrowAnnotate.deactivate(this.container, 1);
  }

  render() {
    return (
      <div style={{
        height: '100%'
      }}>
        <input type="range" id="scrollbar" min={1} max={this.imageNumber} step={1}
          onMouseUp={(e) => this.onDragScrollBar(e)}
          style={{
            ...{
              width: this.containerHeight
            },
            ...{
              top: this.topValue
            },
            ...{
              right: this.rightValue
            }
          }}
        />
        <div ref="viewerContainer" id="viewer">
          <LoadingScene show={this.state.isLoading} />
          <div className="text-info disable-selection patient-info" id="patientInfo">
            <div>
              <span>病人姓名: {this.displayInfo.patientName}</span>
              <br />
              <span>检查号: {this.displayInfo.patientId}</span>
            </div>
          </div>
          <div className="text-info disable-selection dicom-info" id="dicomInfo">
            <span className="pull-right">{`W ${this.state.voi.windowWidth} / L ${this.state.voi.windowCenter}`}</span>
            <br />
            <span className="pull-right">缩放: {this.state.zoomScale}</span>
          </div>
          <div className="text-info disable-selection slice-info" id="sliceInfo">
            <span className="pull-left">图像大小: {this.displayInfo.rows}*{this.displayInfo.cols}</span>
            <br />
            <span className="pull-left">层数: {this.index}/{this.imageNumber}</span>
            <br />
            <span className="pull-left">层厚: {this.displayInfo.thickness}mm</span>
            <br />
            <span className="pull-left">像素间距: {this.displayInfo.pixelSpacing}</span>
          </div>
          <div className="text-info disable-selection time-info" id="timeInfo">
            <span className="pull-right">{this.displayInfo.dateTime}</span>
          </div>
        </div>
      </div>
    );
  }
}
Meteor.subscribe('marks');
