import { HTTP } from 'meteor/http';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Button, Navbar, NavItem, Nav, OverlayTrigger, Popover, ButtonGroup } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from '../../library/cornerstoneTools';
import FontAwesome from 'react-fontawesome';
import { Cases } from '../../api/cases';
import { Marks } from '../../api/marks';
import { ToastContainer, toast } from 'react-toastify';
import { _ } from 'underscore';
import ReactSVG from 'react-svg';

import LeftPanel from './LeftPanel';
import MainCanvas from './MainCanvas';
import CustomEventEmitter from '../../library/CustomEventEmitter';
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
  }
};
const customEventEmitter = new CustomEventEmitter()

export class Viewer extends Component {
  /**
   * constructor, run at first
   * @param props
   */
  constructor(props) {
    super(props);

    this.studyInstanceUID = props.location.query.studyInstanceUID ? props.location.query.studyInstanceUID : props.location.state.studyUID;
    this.seriesNumber = props.location.state.seriesNumber;
    this.state = {
      canvasParams: {},
      seriesList: [],
      caseInfo: Cases.findOne({ studyInstanceUID: this.studyInstanceUID }),
      circleVisible: true,
      isDiagnosisPanelOpened: false,
      isLoadingPanelFinished: false,
      isMagnifyToolOpened: false,
      isRotateMenuOpened: false,
      isWindowToolOpened: false,
      isFullScreen: false,
    };
    this.toastInfo = this.toastInfo.bind(this)
  }

  /**
   * will run after elements rendered
   */
  componentDidMount() {
    /**
     * make NavItems would not lose focus when clicked on the spare place in the page
     */
    $('li a').click(function (e) {
      $('a').removeClass('active-nav-item');
      $(this).addClass('active-nav-item');
    });

    /**
     * set the dynamic height for container
     */
    this.setState({
      containerHeight: (window.innerHeight - document.getElementById('top').clientHeight),
      // containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth),
      topValue: (window.innerHeight - document.getElementById('top').clientHeight) / 2 - 8 + "px",
      rightValue: -((window.innerHeight - document.getElementById('top').clientHeight) / 2 - 10) + 'px'
    });
  }

  componentWillUnmount() {
    customEventEmitter.unsubscribe('changeSeries');
    Meteor.call("freeMemory", this.state.caseInfo._id, (err, result) => {
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.caseInfo) {
      this.setState({
        caseInfo: nextProps.case
      });
    }
  }

  /**
   * handle tool selection
   * @param selectedKey the key of selected MenuItem
   */
  onNavSelected(selectedKey) {
    this.setState({
      canvasParams: {
        btnClicked: selectedKey
      }
    });
  }

  /**
   * toggle magnify popover
   */
  toggleMagnifyPopover() {
    this.setState({ isMagnifyToolOpened: !this.state.isMagnifyToolOpened });
  }

  /**
   * toggle rotate popover
   */
  toggleRotatePopover() {
    this.setState({ isRotateMenuOpened: !this.state.isRotateMenuOpened });
  }

  /**
   * toggle window tool popover
   */
  toggleWindowPopover() {
    this.setState({ isWindowToolOpened: !this.state.isWindowToolOpened });
  }

  /**
   * get correct caret according to the status
   */
  getCaret(isOpened) {
    return isOpened ? <FontAwesome style={{ paddingLeft: '5px', position: 'absolute' }} name='caret-up' size='lg' /> :
      <FontAwesome style={{ paddingLeft: '5px', position: 'absolute', marginTop: '5px' }} name='caret-down' size='lg' />
  }

  /**
   * set selected or entered windowWidth and windowCenter into state
   * @param ww selected window width
   * @param wl selected window center
   */
  setWindowParams(ww, wl) {
    if (ww === undefined || wl === undefined) {
      return;
    }

    if (this.state.canvasParams.windowParams && this.state.canvasParams.windowParams.ww === ww && this.state.canvasParams.windowParams.wl === wl) {
      return;
    }

    this.setState({
      canvasParams: {
        windowParams: {
          ww: ww,
          wl: wl
        }
      }
    }, () => {
      document.getElementById('windowPopoverTrigger').click();
    });
  }

  /**
   * create window tool popover component for rendering
   */
  getWindowPopover() {
    return (
      <Popover id="window-popover" className="popover-positioned-bottom">
        <ul>
          <li onClick={() => this.setWindowParams(80, 40)}>CT脑窗</li>
          <li onClick={() => this.setWindowParams(350, 40)}>CT胸窗</li>
          <li onClick={() => this.setWindowParams(350, 40)}>CT腹窗</li>
          <li onClick={() => this.setWindowParams(1500, -600)}>CT肺窗</li>
          <li onClick={() => this.setWindowParams(2500, 480)}>CT骨窗</li>
          <li onClick={() => this.setWindowParams(350, 90)}>CT面颅软组织窗</li>
        </ul>
        <div className="row div-input">
          <div className="col-sm-6">
            <input type="number" placeholder="ww" onChange={(e) => this.setState({ newWindowWidth: parseInt(e.target.value) })} />
          </div>
          <div className="col-sm-6 pull-right">
            <input type="number" placeholder="wl" onChange={(e) => this.setState({ newWindowCenter: parseInt(e.target.value) })} />
          </div>
        </div>
        <div className="div-confirm">
          <Button className="btn-window-confirm" onClick={() => this.setWindowParams(this.state.newWindowWidth, this.state.newWindowCenter)}>确认</Button>
        </div>
      </Popover>
    )
  }

  /**
   * callback function which is responsible for clearing params that already manipulated by child component (mainCanvas)
   */
  clearCanvasParams() {
    this.setState({
      canvasParams: {}
    });
  }

  fullScreen() {
    this.setState({ isFullScreen: !this.state.isFullScreen }, () => {
      if (this.state.isFullScreen) {
        let de = document.documentElement;
        if (this.state.isFullScreen)
          if (de.requestFullscreen) {
            de.requestFullscreen();
          } else if (de.mozRequestFullScreen) {
            de.mozRequestFullScreen();
          } else if (de.webkitRequestFullScreen) {
            de.webkitRequestFullScreen();
          }
      } else {
        let de = document;
        if (de.exitFullscreen) {
            de.exitFullscreen();
        } else if (de.mozCancelFullScreen) {
            de.mozCancelFullScreen();
        } else if (de.webkitCancelFullScreen) {
            de.webkitCancelFullScreen();
        }
      }
    })
  }

  toastInfo(type, data) {
    switch (type) {

      case 'success':
        toast.success(data);
        break;

      case 'default':
        toast.default(data)
        break;

      case 'warning':
        toast.warning(data);
        break;

      case 'error':
        toast.error(data);
        break;

      default:
        toast.default(data)
        break;
    }
  }

  render() {
    let config = cornerstoneTools.magnify.getConfiguration();

    let rotatePopover = (
      <Popover id="rotate-popover" className="popover-positioned-bottom">
        <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.onNavSelected('FLIP_H')}>
          <div style={{ paddingBottom: '5px' }}>
            <FontAwesome name='arrows-h' size='2x' />
          </div>
          <span>水平翻转</span>
        </div>
        <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.onNavSelected('FLIP_V')}>
          <div style={{ paddingBottom: '5px' }}>
            <FontAwesome name='arrows-v' size='2x' />
          </div>
          <span>垂直翻转</span>
        </div>
        <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.onNavSelected('ROTATE_COUNTERCLOCKWISE')}>
          <div style={{ paddingBottom: '5px' }}>
            <FontAwesome name='rotate-left' size='2x' />
          </div>
          <span>向左旋转</span>
        </div>
        <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.onNavSelected('ROTATE_CLOCKWISE')}>
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
      magnifyCaret = this.getCaret(this.state.isMagnifyToolOpened),
      windowCaret = this.getCaret(this.state.isWindowToolOpened);

    return (
      <div id="body" style={style.body}>
        <div id="top" style={style.top}>
          <Navbar inverse collapseOnSelect style={{ marginBottom: '0' }}>
            <Navbar.Collapse style={{ minWidth: '1300px' }}>
              <Nav onSelect={(selectedKey) => this.onNavSelected(selectedKey)}>
                <NavItem eventKey="WINDOW" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='adjust' size='2x' />
                  </div>
                  <span>W/L</span>
                  <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={this.getWindowPopover()}
                    onClick={() => {
                      if (!this.state.isWindowToolOpened) {
                        this.toggleWindowPopover();
                      }
                    }}
                    onExited={() => { this.toggleWindowPopover(); }}
                  >
                    <span id="windowPopoverTrigger">{windowCaret}</span>
                  </OverlayTrigger>
                </NavItem>
                <NavItem eventKey="ZOOM" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='search' size='2x' />
                  </div>
                  <span>缩放</span>
                </NavItem>
                <NavItem eventKey="PAN" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='hand-paper-o' size='2x' />
                  </div>
                  <span>拖动</span>
                </NavItem>
              </Nav>
              <Navbar.Text className="button" onClick={() => this.onNavSelected('INVERT')}>
                <FontAwesome name='square' size='2x' />
                <br />
                <span>反色</span>
              </Navbar.Text>
              <Navbar.Text className="button">
                <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={rotatePopover}
                  onClick={() => {
                    if (!this.state.isRotateMenuOpened) {
                      this.toggleRotatePopover();
                    }
                  }}
                  onExited={() => { this.toggleRotatePopover(); }}
                >
                  <span>
                    <FontAwesome name='cog' size='2x' />
                    <br />
                    <span>旋转{rotateCaret}</span>
                  </span>
                </OverlayTrigger>
              </Navbar.Text>
              <Navbar.Text className="button" onClick={() => this.onNavSelected('RESET')}>
                <FontAwesome name='refresh' size='2x' /><br />
                <span>重置</span>
              </Navbar.Text>
              <Navbar.Text style={{ borderLeft: '2px solid #9ccef9', height: '50px' }}></Navbar.Text>
              <Nav onSelect={(selectedKey) => this.onNavSelected(selectedKey)}>
                <NavItem eventKey="ANNOTATION" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='arrow-up' size='2x' />
                  </div>
                  <span>标注</span>
                </NavItem>
                <NavItem eventKey="LENGTH" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='arrows-h' size='2x' />
                  </div>
                  <span>测量</span>
                </NavItem>
                <NavItem eventKey="RECTANGLE" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='square-o' size='2x' />
                  </div>
                  <span>矩形</span>
                </NavItem>
                <NavItem eventKey="PROBE" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='circle-o' size='2x' />
                  </div>
                  <span>圆点</span>
                </NavItem>
                <NavItem eventKey="ANGLE" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='chevron-down' size='2x' />
                  </div>
                  <span>角度</span>
                </NavItem>
                <NavItem eventKey="HIGHLIGHT" href="#">
                  <div style={style.icon}>
                    <FontAwesome name='sun-o' size='2x' />
                  </div>
                  <span>高亮</span>
                </NavItem>
                <NavItem eventKey="MAGNIFY" href="#">
                  <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={magnifyPopover}
                    onClick={() => {
                      if (!this.state.isMagnifyToolOpened) {
                        this.toggleMagnifyPopover();
                      }
                    }}
                    onExited={() => this.toggleMagnifyPopover()}>
                    <div>
                      <div style={style.icon}>
                        <FontAwesome name='search-plus' size='2x' />
                      </div>
                      <span>放大{magnifyCaret}</span>
                    </div>
                  </OverlayTrigger>
                </NavItem>
              </Nav>
              <Navbar.Text className="button" onClick={() => this.onNavSelected('CLEAR')}>
                <FontAwesome name='trash' size='2x' />
                <br />
                <span>清除</span>
              </Navbar.Text>
              <Navbar.Text style={{ borderLeft: '2px solid #9ccef9', height: '50px' }}></Navbar.Text>
              <Navbar.Text className="button" onClick={() => this.onNavSelected('SAVE')}>
                <FontAwesome name='save' size='2x' />
                <br />
                <span>保存</span>
              </Navbar.Text>
              <Navbar.Text className="button" onClick={() => this.onNavSelected('RESTORE')}>
                <FontAwesome name='paste' size='2x' />
                <br />
                <span>载入</span>
              </Navbar.Text>
              <Navbar.Text className="button" onClick={() => this.onNavSelected('SWITCH')}>
                <FontAwesome name={this.state.circleVisible ? 'eye-slash' : 'eye'} size='2x' />
                <br />
                <span>{this.state.circleVisible ? '隐藏' : '展示'}</span>
              </Navbar.Text>
              <div className="viewer_pullright">
                <Navbar.Text className="button" onClick={Meteor.userId() ? browserHistory.goBack : null}>
                  <FontAwesome name='reply' size='2x' />
                  <br />
                  <span>返回</span>
                </Navbar.Text>
                <Navbar.Text className="button" onClick={() => this.fullScreen()}>
                  <FontAwesome name='arrows' size='2x' />
                  <br />
                  <span>全屏</span>
                </Navbar.Text>
              </div>

            </Navbar.Collapse>
          </Navbar>
        </div>

        {this.state.caseInfo &&
          <div>
            <div className="left-panel">
              <LeftPanel
                toastInfo={this.toastInfo}
                seriesNumber={this.seriesNumber}
                caseList={this.state.seriesList}
                caseId={this.state.caseInfo._id}
                containerHeight={this.state.containerHeight} />
            </div>

            <div className="main-canvas">
              <MainCanvas
                toastInfo={this.toastInfo}
                caseId={this.state.caseInfo._id}
                seriesNumber={this.seriesNumber}
                canvasParams={this.state.canvasParams}
                callback={() => this.clearCanvasParams()}
              />
            </div>
          </div>
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

export default withTracker(props => {
  Meteor.subscribe('cases');
  let studyUID = props.location.state ? props.location.state.studyUID : undefined;
  return {
    case: Cases.findOne({ studyInstanceUID: props.location.query.studyInstanceUID ? props.location.query.studyInstanceUID : studyUID }),
  }
})(Viewer);
