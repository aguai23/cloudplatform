import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { Button, Navbar, NavItem, Nav, OverlayTrigger, Popover, ButtonGroup } from 'react-bootstrap';
import ReactSVG from 'react-svg';
import { Cases } from '../api/cases';
import FontAwesome from 'react-fontawesome';
import cornerstone from 'cornerstone-core';
import './css/leftPanel.css';

const style = {
  diagnosisBox: {
    position: 'relative',
    width: '20%',
    float: 'left',
    border: '1px solid #aaf7f4',
    padding: '10px 20px 10px 20px',
    color: '#9ccef9',
    fontSize: '12px',
    fontWeight: '300',
    overflowY: 'scroll'
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

export default class LeftPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seriesList: [],
      diagnosisButton: 'primary',
      thumbnailButton: 'default',
      curSeriesIndex: props.curSeriesIndex,
    }
    this.getThumbnails = this.getThumbnails.bind(this)
    this.getThumbnails(props.caseId)
  }

  getThumbnails(caseId) {
    Meteor.call('getThumbnailDicoms', caseId, (err, result) => {
      let foundCase = Cases.findOne({ _id: caseId });
      if (err) {
        return console.error(err);
      }

      this.setState({
        thumbnailArray: result.array,
        seriesList: foundCase.seriesList,
        caseInfo: foundCase
      }, () => {
        for (let i = 0; i < this.state.seriesList.length; i++) {
          let element = document.getElementById('thumbnail' + i);
          cornerstone.enable(element);
          this.enableThumbnailCanvas(i, document.getElementById('thumbnail' + i));
        }

      });
    });
  }

  enableThumbnailCanvas(seriesIndex, element) {
    let image = this.state.thumbnailArray[seriesIndex];
    let pixelData = new Uint16Array(image.imageBuf.buffer, image.pixelDataOffset, image.pixelDataLength / 2);
    image.getPixelData = function () {
      return pixelData;
    };

    cornerstone.displayImage(element, image);
  }

  switchSeries(seriesIndex) {
    if (this.state.curSeriesIndex === seriesIndex) return;

    this.setState({
      curSeriesIndex: seriesIndex
    }, function () {
      //TODO: call mainCanvas to rebuild the page
      // this.initMainCanvas(this.props.location.state.caseId, this.state.curSeriesIndex);
    });
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
      },
        function () {
          for (let i = 0; i < this.state.seriesList.length; i++) {
            let element = document.getElementById('thumbnail' + i);
            cornerstone.enable(element);
            this.enableThumbnailCanvas(i, document.getElementById('thumbnail' + i));
          }

        }
      );
    } else {
      this.setState({
        isDiagnosisPanelOpened: !this.state.isDiagnosisPanelOpened,
        diagnosisButton: 'default',
        thumbnailButton: 'primary'
      }, function () {
        const start = new Date().getTime();
        const caseInfo = this.state.caseInfo
        const algorithmInfo = caseInfo.seriesList[this.state.curSeriesIndex].diagnoseResult;
        const seriesNumber = caseInfo.seriesList[this.state.curSeriesIndex].seriesNumber;
        if (algorithmInfo && algorithmInfo.circle) {
          //TODO: render it in viewer.jsx
          // const end = new Date().getTime();
          // console.log("total time " + (end - start) / 1000);
          // this.setState({ isLoadingPanelFinished: true });

          // cornerstoneTools.ellipticalRoi.enable(this.state.container, 1);
          // let caseId = this.props.location.state.caseId;
          // let elements = [this.state.container];
          // let currentState = cornerstoneTools.appState.save(elements);
          // let result = JSON.parse(algorithmInfo.circle)
          // if (!this.state.diagnosisResult || !this.state.diagnosisResult[this.state.curSeriesIndex]) {
          //   this.extract(result);
          // }

          // let picList = {};
          // _.mapObject(result, (val, key) => {
          //   val.num = key.split("_")[0];
          //   if (picList[key.split("_")[1]] !== undefined) {
          //     picList[key.split("_")[1]].push(val)
          //   } else {
          //     picList[key.split("_")[1]] = [val]
          //   }
          // });
          // _.mapObject(picList, (val, key) => {
          //   if (!currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`]) {
          //     currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`] = { ellipticalRoi: { data: [] } }
          //   }
          //   let tempList = [];
          //   _.each(val, (obj) => {
          //     const standard = {
          //       visible: true,
          //       active: false,
          //       invalidated: false,
          //       handles: {
          //         start: {
          //           "x": 0,
          //           "y": 0,
          //           "highlight": true,
          //           "active": false
          //         },
          //         end: {
          //           "x": 0,
          //           "y": 0,
          //           "highlight": true,
          //           "active": false
          //         },
          //         textBox: {
          //           "active": false,
          //           "hasMoved": false,
          //           "movesIndependently": false,
          //           "drawnIndependently": true,
          //           "allowedOutsideImage": true,
          //           "hasBoundingBox": true,
          //           "index": 1,
          //         }
          //       },
          //     };
          //     standard.handles.start.x = obj.y0;
          //     standard.handles.start.y = obj.x0;
          //     standard.handles.end.x = obj.y1;
          //     standard.handles.end.y = obj.x1;
          //     standard.handles.textBox.index = obj.num;
          //     tempList.push(standard)
          //   });
          //   picList[key] = tempList;
          //   currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`].ellipticalRoi = { data: tempList }
          // })

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
          // HTTP.call('GET', Meteor.settings.public.ALGORITHM_SERVER + '/lung_nodule' +
          //   foundcase.seriesList[this.state.curSeriesIndex].path,
          //   (error, res) => {
          //     if (error) {
          //       return console.error(error);
          //     }
          //     if (res.content === 'error') {
          //       toast.error('服务器异常')
          //       this.setState({
          //         isDiagnosing: false
          //       });
          //       return
          //     }
          //     console.log('res', res)
          //     toast.success('诊断完成')
          //     const end = new Date().getTime();
          //     console.log("total time " + (end - start) / 1000);
          //     this.setState({
          //       isLoadingPanelFinished: true,
          //       isDiagnosing: false
          //     });
          //     cornerstoneTools.ellipticalRoi.enable(this.state.container, 1);

          //     let caseId = this.props.location.state.caseId;
          //     let elements = [this.state.container];
          //     let currentState = cornerstoneTools.appState.save(elements);
          //     let result = JSON.parse(res.content);
          //     if (!this.state.diagnosisResult || !this.state.diagnosisResult[this.state.curSeriesIndex]) {
          //       this.extract(result);
          //     }

          //     let picList = {};
          //     _.mapObject(result, (val, key) => {
          //       val.num = key.split("_")[0];
          //       if (picList[key.split("_")[1]] != undefined) {
          //         picList[key.split("_")[1]].push(val)
          //       } else {
          //         picList[key.split("_")[1]] = [val]
          //       }
          //     });
          //     _.mapObject(picList, (val, key) => {
          //       if (!currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`]) {
          //         currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`] = { ellipticalRoi: { data: [] } }
          //       }
          //       let tempList = [];
          //       _.each(val, (obj) => {
          //         const standard = {
          //           visible: true,
          //           active: false,
          //           invalidated: false,
          //           handles: {
          //             start: {
          //               "x": 146.26041666666666,
          //               "y": 91.83333333333331,
          //               "highlight": true,
          //               "active": false
          //             },
          //             end: {
          //               "x": 387.92708333333337,
          //               "y": 275.16666666666663,
          //               "highlight": true,
          //               "active": false
          //             },
          //             textBox: {
          //               "active": false,
          //               "hasMoved": false,
          //               "movesIndependently": false,
          //               "drawnIndependently": true,
          //               "allowedOutsideImage": true,
          //               "hasBoundingBox": true,
          //               "index": 1,
          //             }
          //           },
          //         };
          //         standard.handles.start.x = obj.y0;
          //         standard.handles.start.y = obj.x0;
          //         standard.handles.end.x = obj.y1;
          //         standard.handles.end.y = obj.x1;
          //         standard.handles.textBox.index = obj.num;
          //         tempList.push(standard)
          //       });
          //       picList[key] = tempList;
          //       currentState.imageIdToolState[`${caseId}#${seriesNumber}#${key}`].ellipticalRoi = { data: tempList }
          //     })
          //   });
        }
      }
      );
    }
  }


  render() {
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
      this.state.seriesList && this.state.seriesList.length > 0 ? (
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
      <div id="diagnosisInfo" style={{overflow: 'hidden'}}>
        <ButtonGroup className="btn-panel-controller" justified>
          <Button active={this.state.diagnosisButton === 'default'} bsSize="large" onClick={this.switchPanelState.bind(this, 0)} href="#" >结节列表</Button>
          <Button active={this.state.thumbnailButton === 'default'} bsSize="large" onClick={this.switchPanelState.bind(this, 1)} href="#" >序列列表</Button>
        </ButtonGroup>
        <div style={{overflowY:'hidden'}}>

        {diagnosisBox}
        {thumbnailBox}
        </div>
      </div>
    );
  }
}
