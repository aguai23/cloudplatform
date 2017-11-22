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
    const studyInstanceUID = props.location.query.studyInstanceUID ? props.location.query.studyInstanceUID : props.location.state.studyUID
    super(props);
    this.state = {
      container: {},
      seriesList: [],
      caseInfo: Cases.findOne({ studyInstanceUID: studyInstanceUID }),
      circleVisible: true,
      zoomScale: 0,
      isScrollBarHovered: false,
      isScrollBarClicked: false,
      scrollBarStyle: style.scrollBar,
      timer: undefined,
      lastY: 0,
      startY: 0,
      curSeriesIndex: this.props.location.state && this.props.location.state.index ? this.props.location.state.index : 0,
      isDiagnosisPanelOpened: false,
      isLoadingPanelFinished: false,
      isMagnifyToolOpened: false,
      isRotateMenuOpened: false,
      imageLoaded: false,
      diagnosisButton: 'primary',
      thumbnailButton: 'default',
      loadingProgress: 0

    };
    this.toastInfo = this.toastInfo.bind(this)
    customEventEmitter.subscribe('changeSeries', (data) => {
      this.setState({
        curSeriesIndex: data.curSeriesIndex
      })
    })
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
    customEventEmitter.unsubscribe('changeSeries')
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
    this.setState({ btnClicked: selectedKey });
  }

  toggleMagnifyPopover() {
    this.setState({ isMagnifyToolOpened: !this.state.isMagnifyToolOpened });
  }

  toggleRotatePopover() {
    this.setState({ isRotateMenuOpened: !this.state.isRotateMenuOpened });
  }

  getCaret(isOpened) {
    return isOpened ? <FontAwesome style={{ paddingLeft: '5px', position: 'absolute' }} name='caret-up' size='lg' /> :
      <FontAwesome style={{ paddingLeft: '5px', position: 'absolute', marginTop: '5px' }} name='caret-down' size='lg' />
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
      magnifyCaret = this.getCaret(this.state.isMagnifyToolOpened);

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
                  <span>窗宽窗位</span>
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
                  onClick={() => { this.toggleRotatePopover(); this.onNavSelected(); }}
                  onExited={() => { this.toggleRotatePopover(); this.onNavSelected(); }}
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
              <Navbar.Text className="button" onClick={browserHistory.goBack}>
                <FontAwesome name='reply' size='2x' />
                <br />
                <span>返回</span>
              </Navbar.Text>
            </Navbar.Collapse>
          </Navbar>
        </div>

        {this.state.caseInfo &&
          <div>
            <div className="left-panel">
              <LeftPanel
                toastInfo={this.toastInfo}
                curSeriesIndex={this.state.curSeriesIndex}
                caseList={this.state.seriesList}
                caseId={this.state.caseInfo._id}
                containerHeight={this.state.containerHeight} />
            </div>

            <div className="main-canvas">
              <MainCanvas
                toastInfo={this.toastInfo}
                caseId={this.state.caseInfo._id}
                curSeriesIndex={this.state.curSeriesIndex}
                controllerBtnClicked={this.state.btnClicked}
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
  return {
    case: Cases.findOne({ studyInstanceUID: props.location.query.studyInstanceUID ? props.location.query.studyInstanceUID : props.location.state.studyUID }),
  }
})(Viewer);