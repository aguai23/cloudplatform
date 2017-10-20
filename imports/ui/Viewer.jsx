import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Button, Col, Navbar, NavItem, Nav, NavDropdown, MenuItem, Jumbotron } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import dicomParse from 'dicom-parser';
import FS from 'fs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import FontAwesome from 'react-fontawesome';
import io from '../library/socket';
import { Marks } from '../api/marks';
import { ToastContainer, toast } from 'react-toastify';
import { _ } from 'underscore';
import { Motion, spring } from 'react-motion';


const style = {
    body: {
        backgroundColor: 'black',
        minHeight: '100%',
        maxHeight: '100%'
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
        position: 'absolute',
        border: '1px solid #42f4ee',
        display: 'inline-block',
        float: 'left'
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
        width: '400px',
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
        right: '5px',
        top: '10px',
        borderRadius: '4px',
        opacity: '0.5',

        userDrag: 'none',
        userSelect: 'none',
        MozUserSelect: 'none',
        WebkitUserDrag: 'none',
        WebkitUserSelect: 'none',
        MsUserSelect: 'none'
    },
    disableSelection: {
        userSelect: 'none',
        MozUserSelect: 'none',
        KhtmlUserSelect: 'none',
        WebkitUserSelect: 'none',
        OUserSelect: 'none',
        cursor: 'default'
    },
    icon: {
        textAlign: "center",
        verticalAlign: "center",
    },
    diagnosisInfo: {
      position: 'relative',
      width: '20%',
      backgroundColor: 'red',
      display: 'inline-block',
      float: 'left'
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
            circleVisible: true,
            index:1,
            imageNumber:0,
            zoomScale: 0,
            voi: {
                windowCenter: 0,
                windowWidth: 0
            },
            dateTime: new Date().toLocaleString(),
            isScrollBarHovered: false,
            isScrollBarClicked: false,
            scrollBarStyle: style.scrollBar,
            timer: undefined,
            lastY: 0,
            startY: 0,

            isDiagnosisPanelOpened: false

        };
        this.updateInfo = this.updateInfo.bind(this);

        Meteor.subscribe('cases');
    }

    /**
     * will run after elements rendered
     */
    componentDidMount() {
        /**
         * re-render when window resized
         */
        window.addEventListener('resize', () => this.updateDimensions());

        /**
         * disable right click in canvas
         */
        document.getElementById('outerContainer').oncontextmenu = function(e) {
          e.preventDefault();
        };

        /**
         * set the dynamic height for container
         */
        this.setState({
            containerHeight: (window.innerHeight - document.getElementById('top').clientHeight) + 'px',
            containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth) + 'px',
            scrollbarTopMin: $('#scrollBar').position().top,
            scrollbarTopMax: $('#scrollBar').position().top + $('#viewer').height()
        });

        this.setState({
            container: document.getElementById("viewer")
        }, (err) => {
            if (err) {
                return console.log(err);
            }

            cornerstone.enable(document.getElementById("viewer"));
            cornerstoneTools.addStackStateManager(this.state.container, ['stack']);
            cornerstoneTools.toolColors.setToolColor("#ffcc33");
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
                if (result.status === "SUCCESS") {
                    this.setState({
                        imageNumber:result.imageNumber,
                        patientId : result.patientId,
                        patientName: result.patientName,
                        rows: result.rows,
                        cols: result.cols,
                        pixelSpacing: result.pixelSpacing,
                        thickness: result.thickness
                    });
                    this.setSlice(this.state.index);
                    //set info here
                    let element = $("#viewer");
                    element.on("CornerstoneImageRendered", this.updateInfo);
                }

            }
        });



    }

    componentWillUnmount() {
        window.removeEventListener("resize", () => this.updateDimensions());
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
      console.log('resize');
      this.setState({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      })
    }

    /**
     * increase slice number
     */
    increaseSlice(scrollStep){
        if (this.state.index < this.state.imageNumber) {
            let position = $('#scrollBar').position();
            this.setState({
                index:this.state.index + 1
            }, function() {
                var newTop = position.top + scrollStep;

                newTop = Math.max(this.state.scrollbarTopMin,
                    Math.min(newTop, this.state.scrollbarTopMax));

                $('#scrollBar').css({top: newTop});
            });
            this.setSlice(this.state.index);
        }
    }

    /**
     * decrease slice number
     */
    decreaseSlice(scrollStep){
        let position = $('#scrollBar').position();
        if (this.state.index > 1) {
            this.setState({
                index:this.state.index - 1
            }, function(){
                var newTop = position.top - scrollStep;

                newTop = Math.max(this.state.scrollbarTopMin,
                    Math.min(newTop, this.state.scrollbarTopMax));

                $('#scrollBar').css({top: newTop});
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
                    viewport.scale = 1.2;
                }
                cornerstone.displayImage(this.state.container, this.state.dicomObj[index], viewport);
            });
        } else {
            cornerstone.displayImage(this.state.container, this.state.dicomObj[index])
        }
    }

    /**
     * handle tool selection
     * @param selectedKey the key of selected MenuItem
     */
    navSelectHandler(selectedKey) {
        switch(selectedKey) {
            case 1:
                this.setScrollTool();
                break;

            case 2:
                this.setWindowTool();
                break;

            case 3:
                this.setZoomTool();
                break;

            case 4:
                this.setLengthTool();
                break;

            case 5:
                this.setDrawTool();
                break;

            case 6:
                this.setEllipticalTool();
                break;

            case 7:
                this.resetViewport();
                break;

            case 8:
                this.saveState();
                break;

            case 9:
                this.restoreState();
                break;

            case 10:
                this.switchState();
                break;


            case 11:
                this.diagnose();
                break;

            default:
                console.log(error);
        }
    }

    /**
     * activate scroll tool, enable both mousewheel and mouse select
     */
    setScrollTool() {
        let element = $("#viewer");
        let self = this;
        let step = element.height() / this.state.imageNumber;
        let startPoint = 0;
        this.disableAllTools();
        element.bind("mousewheel", function (e) {
            let event = window.event || e;
            let down = event.wheelDelta < 0;
            if (down) {
                self.increaseSlice(step);
            } else {
                self.decreaseSlice(step);
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
     * call algorithm to predict result
     */
    predict() {
        // let socket = io('http://localhost:8000');
        // socket.on('result', function (data) {
        //     console.log(data);
        // })


    }

    /**
     * activate rectangle draw function
     */
    setDrawTool() {
        this.disableAllTools();
        cornerstoneTools.rectangleRoi.activate(this.state.container, 1);
    }

    setEllipticalTool(){
        this.disableAllTools();
        cornerstoneTools.ellipticalRoi.activate(this.state.container, 1);
    }

    setLengthTool() {
        this.disableAllTools();
        cornerstoneTools.length.activate(this.state.container, 1);
    }

    /**
     * save mark to database
     */
    saveState(){
        this.disableAllTools();
        let elements = [this.state.container];
        let currentState = cornerstoneTools.appState.save(elements);
        let appState = JSON.parse(JSON.stringify(currentState))
        _.mapObject(appState.imageIdToolState,(val,imageId)=>{
            _.mapObject(val,(data,toolName)=>{
                if(toolName === 'ellipticalRoi'){
                    appState.imageIdToolState[imageId].ellipticalRoi.data = []
                }
            })
        });

        let mark = {
            imageIdToolState: appState.imageIdToolState,
            elementToolState: appState.elementToolState,
            elementViewport: appState.elementViewport,
            source: 'USER',
            createAt: new Date(),
            caseId: this.props.location.query.caseId,
            ownerId: Meteor.userId(),
        };

        let oldState = Marks.findOne({ownerId: Meteor.userId(), caseId: this.props.location.query.caseId});
        if(oldState){
            mark._id = oldState._id;
            Meteor.call('modifyMark',mark,(error)=>{
                if(error){
                    toast.error(`标注保存失败,${error.reacon}`)
                } else {
                    toast.success("标注保存成功!");
                }
            })
        } else {
            Meteor.call('insertMark',mark,(error)=>{
                if(error){
                    toast.error(`标注保存失败,${error.reacon}`)
                } else {
                    toast.success("标注保存成功!");
                }
            })
        }
    }

    /**
     * reload mark from database
     */
    restoreState(){
        this.disableAllTools();
        let elements = [this.state.container];
        let currentState = cornerstoneTools.appState.save(elements);
        let oldState = Marks.findOne({ownerId: Meteor.userId(), caseId: this.props.location.query.caseId});

        /**
         * save system mark to old mark
         */
        _.mapObject(currentState.imageIdToolState,(currentVal,currentImageId)=>{
            _.mapObject(oldState.imageIdToolState,(oldVal,oldImageId)=>{
                if(currentImageId === oldImageId){
                    _.mapObject(currentVal,(data,type)=>{
                        if(type === 'ellipticalRoi'){
                            oldState.imageIdToolState[oldImageId]['ellipticalRoi']['data'] = data.data
                        }
                    })
                }
            })
        })

        cornerstoneTools.appState.restore(oldState)
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
    switchState(){
        this.disableAllTools();
        if(this.state.circleVisible){
            cornerstoneTools.ellipticalRoi.disable(this.state.container, 1);
            this.setState({
                circleVisible: false
            })
        } else {
            cornerstoneTools.ellipticalRoi.activate(this.state.container, 1);
            // cornerstoneTools.ellipticalRoi.enable(this.state.container, 1);
            this.setState({
                circleVisible: true
            })
        }
    }

    /**
     * get diagnosis information from backend
     */
    diagnose() {
        this.setState({
          isDiagnosisPanelOpened: !this.state.isDiagnosisPanelOpened
        }, function() {
          console.log(this.state.isDiagnosisPanelOpened);
        });
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
        this.state.circleVisible && cornerstoneTools.ellipticalRoi.deactivate(this.state.container,1);
        cornerstoneTools.wwwc.deactivate(this.state.container,1);
        cornerstoneTools.pan.deactivate(this.state.container,1);
        cornerstoneTools.zoom.deactivate(this.state.container,4);
        cornerstoneTools.zoomWheel.deactivate(this.state.container);
        cornerstoneTools.length.deactivate(this.state.container, 1);
    }

    /**
     * handler for hovering the scroll bar
     * @param evt mouse hover event
     */
    toggleScrollBarHover(evt){
        this.setState({isScrollBarHovered: !this.state.isScrollBarHovered}, () => {
            if(this.state.isScrollBarHovered) {
                this.state.scrollBarStyle = {
                    ...style.scrollBar,
                    cursor: 'pointer',
                    opacity: 1.0
                }
            } else {
                this.state.scrollBarStyle = {
                    ...style.scrollBar,
                    cursor: 'default',
                    opacity: 0.5
                }
            }
        });

        //this.toggleScrollBarClick(evt);
    }

    /**
     * handler for clicking the scroll bar
     * @param evt mouse events
     */
    toggleScrollBarClick(evt) {
        if(evt.type === 'mouseup' || evt.type === 'mouseleave') {
            if(this.state.isScrollBarClicked) {
                this.setState({isScrollBarClicked: false});
            }
        } else {
            if(evt.button === 0) {
                if(evt.type === 'mousedown' || evt.type === 'mouseenter') {
                    this.setState({isScrollBarClicked: true, lastY: evt.pageY});
                }
            }
        }
    }

    /**
     * handler for draging the scroll bar, moves scrollbar position and changes image
     * @param evt mousemove event
     */
    onDragScrollBar(evt) {
        let step = $("#viewer").height() / this.state.imageNumber;

        if(this.state.isScrollBarClicked) {
            let self = this,
                scrollBar = $('#scrollBar'),
                newTop = scrollBar.position().top + evt.pageY - this.state.lastY;

            newTop = Math.max(this.state.scrollbarTopMin,
                Math.min(newTop, this.state.scrollbarTopMax));

            scrollBar.css({top: newTop});

            if(this.state.timer) {
                window.clearTimeout(this.state.timer);
            }

            let pageY = evt.pageY;

            if(this.state.startY === 0) {
                this.setState({startY: pageY});
            }

            this.setState({
                timer: window.setTimeout(function() {
                    let index = self.state.index + Math.round((pageY - self.state.startY) / step);

                    index = Math.max(1, Math.min(index, self.state.imageNumber));

                    self.setState({startY: pageY, index: index});
                    self.setSlice(index);

                }, 100),
                lastY: evt.pageY
            });
        }

    }

    render() {
        // style={{color: '#9ccef9'}}
        return (
            <div id="body" style={style.body}
                 onMouseMove={(evt) => {this.onDragScrollBar(evt)}}  onMouseUp={(evt) => {this.toggleScrollBarClick(evt)}}
                 onMouseLeave={(evt) => {this.toggleScrollBarClick(evt)}}>
                <div id="top" style={style.top}>
                    <Navbar inverse collapseOnSelect style={{marginBottom: '0'}}>
                        <Navbar.Collapse>
                            <Nav onSelect={(selectedKey) => this.navSelectHandler(selectedKey)}>
                                <NavItem eventKey={1} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='gear' size='2x'/>
                                    </div>
                                    <span>scroll</span>
                                </NavItem>
                                <NavItem eventKey={2} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='adjust' size='2x'/>
                                    </div>
                                    <span>wl/wc</span>
                                </NavItem>
                                <NavItem eventKey={3} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='search' size='2x'/>
                                    </div>
                                    <span>zoom/pan</span>
                                </NavItem>
                                <NavItem eventKey={4} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='arrows-h' size='2x'/>
                                    </div>
                                    <span>length</span>
                                </NavItem>
                                <NavItem eventKey={5} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='square-o' size='2x'/>
                                    </div>
                                    <span>draw</span>
                                </NavItem>
                                <NavItem eventKey={6} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='circle-o' size='2x'/>
                                    </div>
                                    <span>circle</span>
                                </NavItem>
                                <NavItem eventKey={7} href="#">
                                    <div>
                                        <FontAwesome name='refresh' size='2x'/>
                                    </div>
                                    <span>reset</span>
                                </NavItem>
                                <NavItem eventKey={8} href="#">
                                    <div>
                                        <FontAwesome name='save' size='2x'/>
                                    </div>
                                    <span>save</span>
                                </NavItem>
                                <NavItem eventKey={9} href="#">
                                    <div>
                                        <FontAwesome name='paste' size='2x'/>
                                    </div>
                                    <span>restore</span>
                                </NavItem>
                                <NavItem eventKey={10} href="#">
                                    <div>
                                        <FontAwesome name={this.state.circleVisible?'eye-slash':'eye'} size='2x'/>
                                    </div>
                                    <span>{this.state.circleVisible?'hide':'show'}</span>
                                </NavItem>
                                <NavItem eventKey={11} href="#">
                                    <div>
                                        <FontAwesome name='stethoscope' size='2x'/>
                                    </div>
                                    <span>Diagnose</span>
                                </NavItem>
                            </Nav>
                        </Navbar.Collapse>
                    </Navbar>
                </div>

                <div id="diagnosisInfo" style={{...style.diagnosisInfo, ...{height: this.state.containerHeight}}}></div>
                <div id="outerContainer" style={{...style.container, ...{height: this.state.containerHeight, width: this.state.containerWidth}}} className="container">
                    <div id="scrollBar" style={this.state.scrollBarStyle}
                         onMouseDown={(evt) => {this.toggleScrollBarClick(evt)}}
                         onMouseEnter={(evt) => this.toggleScrollBarHover(evt)} onMouseLeave={(evt) => this.toggleScrollBarHover(evt)}>
                    </div>
                    <div style={style.viewer} ref="viewerContainer" id="viewer" >
                        <div style={{...style.patientInfo, ...style.textInfo, ...style.disableSelection}} id="patientInfo">
                            <div>
                                <span>Patient name: {this.state.patientName}</span>
                                <br/>
                                <span>Patient id: {this.state.patientId}</span>
                            </div>
                        </div>
                        <div style={{...style.dicomInfo, ...style.textInfo, ...style.disableSelection}} id="dicomInfo">
                            <span className="pull-right">WW/WC: {this.state.voi.windowWidth}/{this.state.voi.windowCenter}</span>
                            <br/>
                            <span className="pull-right">Zoom: {this.state.zoomScale}</span>
                        </div>
                        <div style={{...style.sliceInfo, ...style.textInfo, ...style.disableSelection}} id="sliceInfo">
                            <span className="pull-left">size: {this.state.rows}*{this.state.cols}</span>
                            <br/>
                            <span className="pull-left">Slice: {this.state.index}/{this.state.imageNumber}</span>
                            <br/>
                            <span className="pull-left">thick: {this.state.thickness} spacing: {this.state.pixelSpacing}</span>

                        </div>
                        <div style={{...style.timeInfo, ...style.textInfo, ...style.disableSelection}} id="timeInfo">
                            <span className="pull-right">{this.state.dateTime}</span>
                        </div>
                    </div>
                </div>

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
