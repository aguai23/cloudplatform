import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import {HTTP} from 'meteor/http';
import { Button, Navbar, NavItem, Nav, OverlayTrigger, Popover, ButtonGroup } from 'react-bootstrap';
import ReactSVG from 'react-svg';
import { Cases } from '../../api/cases';
import FontAwesome from 'react-fontawesome';
import cornerstone from 'cornerstone-core';
import CustomEventEmitter from '../../library/CustomEventEmitter';
import './css/leftPanel.css';

const customEventEmitter = new CustomEventEmitter()

export default class LeftPanel extends Component {
  constructor(props) {
    super(props);
    let foundCase = Cases.findOne({ _id: props.caseId });

    this.loadingList = {};

    for(let i = 0; i < foundCase.seriesList.length; i++) {
      let series = foundCase.seriesList[i];

      this.loadingList[series.seriesNumber] = [];
      this.loadingList[series.seriesNumber].push(series.total);

      for(let j = 0; j < series.total; j++) {
        this.loadingList[series.seriesNumber].push(false);
      }
    }

    // console.log(loadingList);

    this.state = {
      panelType: 'thumbnail',
      caseInstance: foundCase,
      curSeriesNumber: foundCase.seriesList[0].seriesNumber,
      diagnosisResult: [],
      seriesList: foundCase.seriesList,
      loadingList: this.loadingList,
    };

    this.getThumbnails = this.getThumbnails.bind(this);

    customEventEmitter.subscribe('loadThumbnails', () => {
      this.getThumbnails(props.caseId);
    });

    customEventEmitter.subscribe('showSliceLoaded', (data) => {
      this.loadingList[data.seriesNumber][data.index] = true;
      this.setState({
        loadingList: this.loadingList
      });
    });

    this.map = {};
  }

  componentWillUnmount() {
    customEventEmitter.unsubscribe('loadThumbnails');
    customEventEmitter.unsubscribe('showSliceLoaded');
  }

  getThumbnails(caseId) {
    HTTP.call("GET", '/getThumbnailDicoms', {params: {caseId: caseId}}, (err, result) => {
      let foundCase = Cases.findOne({ _id: caseId });
      if (err) {
        return console.error(err);
      }
      result = JSON.parse(result.content);
      this.setState({
        thumbnailArray: result.array
      }, () => {
        for (let i = 0; i < this.state.seriesList.length; i++) {
          let element = document.getElementById('thumbnail' + i);
          cornerstone.enable(element);
          this.enableThumbnailCanvas(i, document.getElementById('thumbnail' + i));
          this.map[this.state.seriesList[i].seriesNumber] = i;
        }
      });
    });
  }

  enableThumbnailCanvas(seriesIndex, element) {
    let image = this.state.thumbnailArray[seriesIndex];
    let pixelData = undefined;
    if (image.imageBuf.data) {
      image.imageBuf = new Uint8Array(image.imageBuf.data);
    }
    if (image.bitsAllocated === 8) {
      pixelData = new Uint16Array(image.pixelDataLength);

      for (let i = 0; i < image.pixelDataLength; i++) {
        pixelData[i] = image.imageBuf[image.pixelDataOffset + i];
      }
    } else if (image.bitsAllocated === 16) {
      pixelData = new Uint16Array(image.imageBuf.buffer, image.pixelDataOffset, image.pixelDataLength / 2);
    }

    image.getPixelData = function () {
      return pixelData;
    };

    cornerstone.displayImage(element, image);
  }

  switchSeries(seriesIndex, seriesNumber) {
    if (this.state.curSeriesNumber === seriesNumber) return;

    this.setState({
      curSeriesNumber: seriesNumber
    }, function () {
      customEventEmitter.dispatch('changeSeries', { caseId: this.props.caseId, seriesNumber: seriesNumber })
    });
  }

  extract(data) {
    let diagnosisResult = {};
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
    let tempResult = {};
    this.setState({ diagnosisResult: diagnosisResult });
  }

  onClickDiagnosisRow(key) {
    $('div').removeClass('leftPanel-activeRow');
    $('#diagnosis-item-' + key).addClass('leftPanel-activeRow');
    customEventEmitter.dispatch('setSlice',Math.min(this.state.diagnosisResult[key].firstSlice, this.state.diagnosisResult[key].lastSlice))
  }

  switchPanelState(isDiagnosis) {
    if (isDiagnosis && this.state.panelType === 'diagnosis' || !isDiagnosis && this.state.panelType === 'thumbnail') {
      return
    }
    if (isDiagnosis) {
      this.setState({
        panelType: 'diagnosis'
      }, function () {
        const start = new Date().getTime();
        const caseInstance = this.state.caseInstance;
        const algorithmInfo = caseInstance.seriesList[this.map[this.state.curSeriesNumber]].diagnoseResult;
        if (algorithmInfo && algorithmInfo.circle) {
          const end = new Date().getTime();
          console.log("total time " + (end - start) / 1000);
          this.setState({ isLoadingPanelFinished: true, diagnosisResult: algorithmInfo }, () => {
            customEventEmitter.dispatch('diagnosisResult', {
              result: algorithmInfo.circle,
              seriesNumber: this.state.curSeriesNumber
            })
          });
          this.extract(JSON.parse(algorithmInfo.circle));
        } else {
          if (this.state.isDiagnosing) {
            this.props.toastInfo('warning', '诊断还未完成，请稍后');
            return
          }
          this.props.toastInfo('warning', '正在进行诊断，请等待');
          this.setState({
            isDiagnosing: true,
            isLoadingPanelFinished: false
          });
          HTTP.call('GET', Meteor.settings.public.ALGORITHM_SERVER + '/lung_nodule' +
          caseInstance.seriesList[this.map[this.state.curSeriesNumber]].path,
            (error, res) => {
              if (error) {
                return console.error(error);
              }
              if (res.content === 'error') {
                this.props.toastInfo('error', '服务器异常');
                this.setState({
                  isDiagnosing: false
                });
                return
              }
              this.props.toastInfo('success', '诊断完成')
              const end = new Date().getTime();
              console.log("total time " + (end - start) / 1000);
              this.setState({
                isLoadingPanelFinished: true,
                isDiagnosing: false
              });
              customEventEmitter.dispatch('diagnosisResult', {
                result: res.content,
                seriesNumber: this.state.curSeriesNumber
              })
              this.extract(JSON.parse(res.content));
            });
        }
      }
      );
    } else {
      this.setState({
        panelType: 'thumbnail'
      }, function () {
        for (let i = 0; i < this.state.seriesList.length; i++) {
          let element = document.getElementById('thumbnail' + i);
          cornerstone.enable(element);
          this.enableThumbnailCanvas(i, document.getElementById('thumbnail' + i));
        }
      }
      );
    }
  }

  getLoadingBlocks(seriesNumber) {
    // console.log('seriesNumber', seriesNumber);
    // console.log(this.state.loadingList[seriesNumber]);
    let loadingList = this.state.loadingList[seriesNumber];

    let col = 45;
    let row = Math.round(loadingList[0] / col - 0.5) + 1;

    let blocks = [];

    for(let i = 0; i < row; i++) {
      blocks[i] = [];
      for(let j = 0; j < col; j++) {
        if(i * col + j < loadingList[0]) {
          // loadingList[i*col + j] ?
          blocks[i][j] = (
            <div key={`col${j}`} className="block" style={{backgroundColor: loadingList[i*col + j + 1] ? 'orange' : 'darkgray'}}></div>
          )
        } else {
          break;
        }
      }
    }

    return (
      <div className="loading-info row">
        {
          blocks.map((row, colNum) => {
            return (
              <div key={`row${colNum}`}>
                {
                  row.map((block, rowNum) => {
                    return block
                  })
                }
              </div>
            )
          })
        }
      </div>
    )
  }


  render() {
    let results = [];

    if (this.state.diagnosisResult) {
      for (let key in this.state.diagnosisResult) {
        results.push(
          <div className="row leftPanel-diagnosisRow" key={'diagnosis-item-' + key} id={'diagnosis-item-' + key}
            onClick={() => this.onClickDiagnosisRow(key)}>
            <div className="col-xs-4">{key}</div>
            <div className="col-xs-4">{Math.min(this.state.diagnosisResult[key].firstSlice, this.state.diagnosisResult[key].lastSlice)
              + ' - ' + Math.max(this.state.diagnosisResult[key].firstSlice, this.state.diagnosisResult[key].lastSlice)}</div>
            <div className="col-xs-4 leftPanel-diagnosisProb">{this.state.diagnosisResult[key].prob * 100 + '%'}</div>
          </div>
        );
      }
    }

    let diagnosisBox = this.state.panelType === 'diagnosis' ? (
      this.state.isLoadingPanelFinished ? (
        <div>
          <div className="leftPanel-diagnosisHeader">
            <h3>病变列表</h3>
          </div>
          <hr style={{ borderColor: '#aaf7f4' }} />
          <div className="leftPanel-listHeader" >
            <div className="col-xs-4">编号</div>
            <div className="col-xs-4">层面</div>
            <div className="col-xs-4 leftPanel-diagnosisProb">概率</div>
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

    let thumbnailBox = this.state.panelType === 'thumbnail' ? (
      this.state.seriesList && this.state.seriesList.length > 0 ? (
        this.state.seriesList.map((series, index) => {
          return (
            <div key={'thumbnail' + index} onClick={() => { this.switchSeries(index, series.seriesNumber) }}>
              <div className={"thumbnail-container " + (this.state.curSeriesNumber === series.seriesNumber ? 'active-thumbnail' : '')}>
                <div className="thumbnailDiv" id={'thumbnail' + index} />
              </div>
              <div className="thumbnail-info row">
                <div className="col-sm-8">
                  {this.state.seriesList[index].seriesDescription}
                </div>
                <div className="col-sm-4" style={{ textAlign: 'center', color: '#91b9cd' }}>
                  <div>
                    <b style={{ color: '#4da2f2' }}>S</b>{' ' + this.state.seriesList[index].seriesNumber}
                    <FontAwesome name='ellipsis-h' size='lg' style={{marginLeft: '5px'}}/>
                    <FontAwesome name='file-image-o' size='lg'  style={{marginLeft: '5px'}}/>{' ' + this.state.seriesList[index].total}
                  </div>
                </div>
              </div>
              {this.getLoadingBlocks(series.seriesNumber)}
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
      <div className="panel-container">
        <ButtonGroup className="btn-panel-controller" justified>
          <Button active={this.state.panelType === 'diagnosis'} bsSize="large" onClick={this.switchPanelState.bind(this, 1)} href="#" >结节列表</Button>
          <Button active={this.state.panelType === 'thumbnail'} bsSize="large" onClick={this.switchPanelState.bind(this, 0)} href="#" >序列列表</Button>
        </ButtonGroup>
        {diagnosisBox}
        {thumbnailBox}
      </div>
    );
  }
}
