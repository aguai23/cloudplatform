import { HTTP } from 'meteor/http';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { Button, Col, Navbar, NavItem, Nav, OverlayTrigger, Popover, Row, MenuItem } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import dicomParse from 'dicom-parser';
import FS from 'fs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from '../library/cornerstoneTools';
import FontAwesome from 'react-fontawesome';
import io from '../library/socket';
import { Marks } from '../api/marks';
import { ToastContainer, toast } from 'react-toastify';
import { _ } from 'underscore';
import ReactSVG from 'react-svg';

import "./css/viewer.css";


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
        border: '1px solid #3bc7f9',
        display: 'inline-block',
        float: 'left',
        overflow: 'hidden'
    },
    viewer: {
        top: '30px',
        height: '800px',
        width: '100%',
        position: 'relative',
        margin: '0 auto'
    },
    textInfo: {
        color: '#9ccef9',
        fontSize: '14px',
        fontWeight: '300',
        zIndex: '1'
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
        height: '10px',
        backgroundColor: 'black',
        position: 'absolute',
        borderRadius: '4px',
        opacity: '0.5',
        WebkitAppearance: "none",
        WebkitTransform: "rotate(90deg)",
        border: "none",
        outline: "none",
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
    diagnosisBox: {
        position: 'relative',
        width: '20%',
        display: 'none',
        float: 'left',
        border: '1px solid #aaf7f4',
        padding: '10px 20px 10px 20px',
        color: '#9ccef9',
        fontSize: '12px',
        fontWeight: '300'
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
            index: 1,
            imageNumber: 0,
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

            isLeftPanelOpened: false,
            isLoadingPanelFinished: false,
            isMagnifyToolOpened: false,
            isRotateMenuOpened: false

        };

        this.updateInfo = this.updateInfo.bind(this);
        this.setSlice = this.setSlice.bind(this);
        this.onDragScrollBar = this.onDragScrollBar.bind(this);
        Meteor.subscribe('cases');
    }

    /**
     * will run after elements rendered
     */
    componentDidMount() {
        if (!Meteor.userId()) {
            browserHistory.replace('/login');
            toast.warning("请先登录再进行操作");
        }

        /**
         * make NavItems would not lose focus when clicked on the spare place in the page
         */
        $('li a').click(function (e) {
            $('a').removeClass('active-nav-item');
            $(this).addClass('active-nav-item');
        });

        /**
         * re-render when window resized
         */
        window.addEventListener('resize', () => this.updateDimensions());

        /**
         * disable right click in canvas and diagnosisBox
         */
        document.getElementById('outerContainer').oncontextmenu = function (e) {
            e.preventDefault();
        };
        document.getElementById('diagnosisInfo').oncontextmenu = function (e) {
            e.preventDefault();
        }

        /**
         * set the dynamic height for container
         */
        this.setState({
            containerHeight: (window.innerHeight - document.getElementById('top').clientHeight) + 'px',
            containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth) + 'px',
            topValue: (window.innerHeight - document.getElementById('top').clientHeight) / 2 - 8 + "px",
            rightValue: -((window.innerHeight - document.getElementById('top').clientHeight) / 2 - 10) + 'px'
        });

        /**
         * enable cornerstone and setup cornerstoneTools
         */
        this.setState({
            container: document.getElementById("viewer")
        }, (err) => {
            if (err) {
                return console.log(err);
            }

            cornerstone.enable(this.state.container);
            cornerstoneTools.addStackStateManager(this.state.container, 'stack');
            cornerstoneTools.toolColors.setToolColor("#ffcc33");
        });

        /**
         * default configuration for magnify tool
         */
        var config = {
            magnifySize: 250,
            magnificationLevel: 4
        };
        cornerstoneTools.magnify.setConfiguration(config);

        /**
         * get current date and time
         */
        window.setInterval(() => {
            this.setState({
                dateTime: new Date().toLocaleString()
            });
        }, 1000);

        /**
         * send a request to require server load all cases first
         */
        Meteor.call('prepareDicoms', this.props.location.state, (error, result) => {
            if (error) {
                console.log(error)
            } else {
                if (result.status === "SUCCESS") {
                    this.setState({
                        imageNumber: result.imageNumber,
                        patientId: result.patientId,
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
                    /**
                     * set scroll tool for default mousewheel operation
                     */
                    this.setScrollTool();
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
            windowHeight: window.innerHeight,
            containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth - 3) + 'px'
        }, function () {
            cornerstone.resize(this.state.container, false);
        });
    }

    /**
     * increase slice number
     */
    increaseSlice() {
        if (this.state.index < this.state.imageNumber) {
            this.setSlice(this.state.index + 1);
        }
    }

    /**
     * decrease slice number
     */
    decreaseSlice() {
        if (this.state.index > 1) {
            this.setSlice(this.state.index - 1);
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
                image.getPixelData = function () {
                    return pixelData
                };
                let currentObj = this.state.dicomObj;
                currentObj[index] = image;
                this.setState({
                    dicomObj: currentObj
                });

                var viewport = {};
                if (index === 1) {
                    viewport.scale = 1.2;
                }
                cornerstone.displayImage(this.state.container, this.state.dicomObj[index], viewport);

                let measurementData = {
                    currentImageIdIndex: this.state.index,
                    imageIds: image.imageId
                }

                cornerstoneTools.addToolState(this.state.container, 'stack', measurementData);
            });
        } else {
            cornerstone.displayImage(this.state.container, this.state.dicomObj[index])
        }
        let scrollbar = document.getElementById("scrollbar");
        scrollbar.value = index;
        this.setState({
            index: index
        });
    }

    /**
     * handle tool selection
     * @param selectedKey the key of selected MenuItem
     */
    navSelectHandler(selectedKey) {
        switch (selectedKey) {
            case 1:
                this.openLeftPanel('SERIES', function() {
                    console.log("xxx");
                });
                break;

            case 2:
                this.setWindowTool();
                break;

            case 3:
                this.setZoomTool();
                break;

            case 4:
                this.setPanTool();
                break;

            case 5:
                this.setLengthTool();
                break;

            case 6:
                this.setDrawTool();
                break;

            case 7:
                this.setProbeTool();
                break;

            case 8:
                this.setAngleTool();
                break;

            case 9:
                this.setHighlightTool();
                break;

            case 10:
                this.setMagnifyTool();
                break;

            case 11:
                this.setAnnotationTool();
                break;
            default:
                console.error(error);
        }
    }

    /**
     * open/close left panel with fadein/fadeout effect
     * @param cb callback after the fading animation
     */
    openLeftPanel(source, cb) {
        let self = this;
        this.setState({
            isLeftPanelOpened: !this.state.isLeftPanelOpened
        }, function() {
            if (this.state.isLeftPanelOpened) {
                $('#diagnosisInfo').fadeIn({
                    start: function () {
                        self.setState({
                            containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth - 3) + 'px'
                        }, function () {
                            cornerstone.resize(this.state.container, false);
                        });
                    },
                    done: function() {
                        self.setState({
                            isLoadingPanelFinished: true
                        }, function() {
                            cb();
                        });
                    }
                });
            } else {
                $('#diagnosisInfo').fadeOut({
                    done: function () {
                        self.setState({
                            containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth) + 'px',
                            isLoadingPanelFinished: source === 'SERIES' ? false : true
                        }, function () {
                            cornerstone.resize(this.state.container, false);
                        });
                    }
                });
            }
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
     * activate rectangle draw function
     */
    setDrawTool() {
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
     * activate length tool
     */
    setLengthTool() {
        this.disableAllTools();
        cornerstoneTools.length.activate(this.state.container, 1);
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

        let mark = {
            imageIdToolState: appState.imageIdToolState,
            elementToolState: appState.elementToolState,
            elementViewport: appState.elementViewport,
            source: 'USER',
            createAt: new Date(),
            caseId: this.props.location.state,
            ownerId: Meteor.userId(),
        };

        let oldState = Marks.findOne({ ownerId: Meteor.userId(), caseId: this.props.location.state });
        if (oldState) {
            mark._id = oldState._id;
            Meteor.call('modifyMark', mark, (error) => {
                if (error) {
                    toast.error(`标注保存失败,${error.reacon}`)
                } else {
                    toast.success("标注保存成功!");
                }
            })
        } else {
            Meteor.call('insertMark', mark, (error) => {
                if (error) {
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
    restoreState() {
        let elements = [this.state.container];
        let currentState = cornerstoneTools.appState.save(elements);
        let oldState = Marks.findOne({ ownerId: Meteor.userId(), caseId: this.props.location.state });

        /**
         * save system mark to old mark
         */
        _.mapObject(currentState.imageIdToolState, (currentVal, currentImageId) => {
            _.mapObject(oldState.imageIdToolState, (oldVal, oldImageId) => {
                if (currentImageId === oldImageId) {
                    _.mapObject(currentVal, (data, type) => {
                        if (type === 'ellipticalRoi') {
                            oldState.imageIdToolState[oldImageId]['ellipticalRoi']['data'] = data.data
                        }
                    })
                }
            })
        });

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
     * get diagnosis information from backend
     */
    diagnose() {
        this.setState({
            isLeftPanelOpened: !this.state.isLeftPanelOpened
        }, function () {
            var self = this;
            if (this.state.isLeftPanelOpened) {
                $('#diagnosisInfo').fadeIn({
                    start: function () {
                        self.setState({
                            containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth - 3) + 'px'
                        }, function () {
                            cornerstone.resize(this.state.container, false);
                        });
                    }
                });

                if(this.state.isLoadingPanelFinished) {
                    return;
                }

                // HTTP.call('GET', 'http://192.168.12.128:5000/lung_nodule/' + 'home/cai/Documents/Data/test', (error, res) => {
                HTTP.call('GET', 'http://192.168.12.158:3000/test', (error, res) => {
                    if(error) {
                        return console.log(error);
                    }

                    // console.log(res);

                    this.setState({isLoadingPanelFinished: true});

                    const algorithmInfo = JSON.parse(sessionStorage.getItem('algorithm'));
                    cornerstoneTools.ellipticalRoi.enable(this.state.container, 1);

                    let caseId = this.props.location.state;
                    let elements = [this.state.container];
                    let currentState = cornerstoneTools.appState.save(elements);
                    if (algorithmInfo) {
                        if (!this.state.diagnosisResult) {
                            this.extract(algorithmInfo.temp);
                        }
                        _.mapObject(algorithmInfo.picList, (val, key) => {
                            if (!currentState.imageIdToolState[`${caseId}#${key}`]) {
                                currentState.imageIdToolState[`${caseId}#${key}`] = { ellipticalRoi: { data: [] } }
                            }
                            currentState.imageIdToolState[`${caseId}#${key}`].ellipticalRoi = { data: algorithmInfo.picList[key] }
                        })
                    } else {
                        let temp = {
                            "1_77": { "y1": 127, "y0": 80, "x0": 190, "x1": 227, "prob": 0.99508569469171382 },
                            "1_76": { "y1": 133, "y0": 77, "x0": 189, "x1": 231, "prob": 0.99508569469171382 },
                            "1_75": { "y1": 136, "y0": 77, "x0": 189, "x1": 237, "prob": 0.99508569469171382 },
                            "1_74": { "y1": 135, "y0": 78, "x0": 190, "x1": 240, "prob": 0.99508569469171382 },
                            "1_73": { "y1": 133, "y0": 82, "x0": 197, "x1": 245, "prob": 0.99508569469171382 },
                            "1_72": { "y1": 135, "y0": 85, "x0": 200, "x1": 245, "prob": 0.99508569469171382 },
                            "1_71": { "y1": 135, "y0": 93, "x0": 210, "x1": 245, "prob": 0.99508569469171382 },
                            "1_70": { "y1": 135, "y0": 98, "x0": 211, "x1": 245, "prob": 0.99508569469171382 },
                            "1_69": { "y1": 132, "y0": 107, "x0": 219, "x1": 243, "prob": 0.99508569469171382 },
                            "1_68": { "y1": 128, "y0": 110, "x0": 224, "x1": 243, "prob": 0.99508569469171382 },
                            "2_113": { "y1": 406, "y0": 385, "x0": 163, "x1": 183, "prob": 0.99221461777707087 },
                            "2_112": { "y1": 408, "y0": 382, "x0": 158, "x1": 186, "prob": 0.99221461777707087 },
                            "2_111": { "y1": 406, "y0": 379, "x0": 160, "x1": 186, "prob": 0.99221461777707087 },
                            "2_110": { "y1": 405, "y0": 379, "x0": 163, "x1": 186, "prob": 0.99221461777707087 },
                            "3_87": { "y1": 135, "y0": 109, "x0": 155, "x1": 172, "prob": 0.99058158466960267 },
                            "3_86": { "y1": 148, "y0": 101, "x0": 147, "x1": 186, "prob": 0.99058158466960267 },
                            "3_85": { "y1": 149, "y0": 91, "x0": 147, "x1": 192, "prob": 0.99058158466960267 },
                            "3_84": { "y1": 148, "y0": 90, "x0": 146, "x1": 196, "prob": 0.99058158466960267 },
                            "3_83": { "y1": 146, "y0": 88, "x0": 150, "x1": 200, "prob": 0.99058158466960267 },
                            "3_82": { "y1": 146, "y0": 88, "x0": 154, "x1": 204, "prob": 0.99058158466960267 },
                            "3_81": { "y1": 146, "y0": 88, "x0": 158, "x1": 205, "prob": 0.99058158466960267 },
                            "3_80": { "y1": 146, "y0": 90, "x0": 160, "x1": 205, "prob": 0.99058158466960267 },
                            "3_79": { "y1": 146, "y0": 91, "x0": 165, "x1": 207, "prob": 0.99058158466960267 },
                            "3_78": { "y1": 146, "y0": 93, "x0": 168, "x1": 207, "prob": 0.99058158466960267 },
                            "3_77": { "y1": 141, "y0": 98, "x0": 178, "x1": 202, "prob": 0.99058158466960267 },
                            "4_75": { "y1": 250, "y0": 232, "x0": 333, "x1": 355, "prob": 0.98716848544019287 },
                            "4_74": { "y1": 251, "y0": 230, "x0": 329, "x1": 357, "prob": 0.98716848544019287 },
                            "4_73": { "y1": 251, "y0": 230, "x0": 328, "x1": 360, "prob": 0.98716848544019287 },
                            "4_72": { "y1": 251, "y0": 230, "x0": 328, "x1": 359, "prob": 0.98716848544019287 },
                            "4_71": { "y1": 250, "y0": 235, "x0": 334, "x1": 352, "prob": 0.98716848544019287 },
                            "5_69": { "y1": 151, "y0": 104, "x0": 240, "x1": 269, "prob": 0.982299394580053 },
                            "5_68": { "y1": 154, "y0": 104, "x0": 237, "x1": 272, "prob": 0.982299394580053 },
                            "5_67": { "y1": 157, "y0": 106, "x0": 235, "x1": 283, "prob": 0.982299394580053 },
                            "5_66": { "y1": 156, "y0": 106, "x0": 238, "x1": 290, "prob": 0.982299394580053 },
                            "5_65": { "y1": 152, "y0": 107, "x0": 243, "x1": 296, "prob": 0.982299394580053 },
                            "5_64": { "y1": 148, "y0": 110, "x0": 253, "x1": 295, "prob": 0.982299394580053 }
                        };

                        if (!this.state.diagnosisResult) {
                            this.extract(temp);
                        }

                        let picList = {}
                        _.mapObject(temp, (val, key) => {
                            val.num = key.split("_")[0];
                            if (picList[key.split("_")[1]] != undefined) {
                                picList[key.split("_")[1]].push(val)
                            } else {
                                picList[key.split("_")[1]] = [val]
                            }
                        })
                        _.mapObject(picList, (val, key) => {
                            if (!currentState.imageIdToolState[`${caseId}#${key}`]) {
                                currentState.imageIdToolState[`${caseId}#${key}`] = { ellipticalRoi: { data: [] } }
                            }
                            let tempList = [];
                            _.each(val, (obj) => {
                                const standard = {
                                    visible: true,
                                    active: false,
                                    invalidated: false,
                                    handles: {
                                        start: {
                                            "x": 146.26041666666666,
                                            "y": 91.83333333333331,
                                            "highlight": true,
                                            "active": false
                                        },
                                        end: {
                                            "x": 387.92708333333337,
                                            "y": 275.16666666666663,
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
                            })
                            picList[key] = tempList
                            sessionStorage.setItem('algorithm', JSON.stringify({ temp, picList }))
                            currentState.imageIdToolState[`${caseId}#${key}`].ellipticalRoi = { data: tempList }
                        })
                    }
                });
            } else {
                $('#diagnosisInfo').fadeOut({
                    done: function () {
                        self.setState({
                            containerWidth: (window.innerWidth - document.getElementById('diagnosisInfo').clientWidth) + 'px'
                        }, function () {
                            cornerstone.resize(this.state.container, false);
                        });
                    }
                });
            }
        });


    }

    /**
     * extract information in data
     */
    extract(data) {
        let diagnosisResult = {};
        for (key in data) {
            let strs = key.split("_");

            if (diagnosisResult[strs[0]]) {
                diagnosisResult[strs[0]].lastSlice = parseInt(strs[1]);
            } else {
                diagnosisResult[strs[0]] = {};
                diagnosisResult[strs[0]].firstSlice = parseInt(strs[1]);
                diagnosisResult[strs[0]].prob = parseFloat(data[key].prob).toFixed(3);
            }
        }

        this.setState({ diagnosisResult: diagnosisResult });
    }

    /**
     * click handler for diagnosisRow, which changes styles and then jumps to the target slice
     */
    onClickDiagnosisRow(key) {
        $('div').removeClass('active-diagnosis-row');
        $('#diagnosis-item-' + key).addClass('active-diagnosis-row');
        this.setSlice(Math.min(this.state.diagnosisResult[key].firstSlice, this.state.diagnosisResult[key].lastSlice));
    }

    /**
     * clear all tool data, e.g. rec, probe and angle
     */
    clearToolData() {
        console.log('cornerstoneTools.globalImageIdSpecificToolStateManager', cornerstoneTools.globalImageIdSpecificToolStateManager);

        let toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
        console.log(toolState);
        let element = cornerstone.getEnabledElement(this.state.container);

        if(!toolState.hasOwnProperty(element.image.imageId)) {
            return;
        }

        for(let toolName in toolState[element.image.imageId]) {
            if(toolName !== 'ellipticalRoi') {
                delete toolState[element.image.imageId][toolName];
            }
        }

        cornerstone.updateImage(this.state.container);
    }

    /**
     * disable tools
     */
    disableAllTools(tag) {
        let element = $("#viewer");

        element.off("mousewheel");

        if(tag !== 'ZOOM') {
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
        cornerstoneTools.arrowAnnotate.deactivate(this.state.container,1);
    }

    toggleMagnifyPopover() {
        this.setState({isMagnifyToolOpened: !this.state.isMagnifyToolOpened});
    }

    toggleRotatePopover() {
        this.setState({isRotateMenuOpened: !this.state.isRotateMenuOpened});
    }

    /**
     * flip viewport
     */
    flipViewport(orientation) {
        let viewport = cornerstone.getViewport(this.state.container);

        if(orientation === 'HORIZONTAL') {
            viewport.hflip = !viewport.hflip;
        } else if(orientation === 'VERTICAL') {
            viewport.vflip = !viewport.vflip;
        }

        cornerstone.setViewport(this.state.container, viewport);
    }

    /**
     * rotate viewport
     */
    rotateViewport(orientation) {
        let viewport = cornerstone.getViewport(this.state.container);

        if(orientation === 'CLOCKWISE') {
            viewport.rotation += 90;
        } else if(orientation === 'COUNTERCLOCKWISE') {
            viewport.rotation -= 90;
        }

        cornerstone.setViewport(this.state.container, viewport);
    }

    /**
     * handler for draging the scroll bar, moves scrollbar position and changes image
     * @param evt mousemove event
     */
    onDragScrollBar() {
        let scrollbar = document.getElementById("scrollbar");
        this.setSlice(parseInt(scrollbar.value));
    }

    getCaret(isOpened) {
        return isOpened ? <FontAwesome style={{paddingLeft: '5px', position: 'absolute'}} name='caret-up' size='lg'/> :
            <FontAwesome style={{paddingLeft: '5px', position: 'absolute', marginTop: '5px'}} name='caret-down' size='lg'/>
    }

    render() {
        let results = [];

        if (this.state.diagnosisResult) {
            for (let key in this.state.diagnosisResult) {
                results.push(
                    <div className="row diagnosisRow" style={style.diagnosisRow} key={'diagnosis-item-' + key} id={'diagnosis-item-' + key}
                         onClick={() => this.onClickDiagnosisRow(key)}>
                        <div className="col-xs-4">{key}</div>
                        <div className="col-xs-4">{Math.min(this.state.diagnosisResult[key].firstSlice, this.state.diagnosisResult[key].lastSlice)
                        + ' - ' + Math.max(this.state.diagnosisResult[key].firstSlice, this.state.diagnosisResult[key].lastSlice)}</div>
                        <div className="col-xs-4" style={style.diagnosisProb}>{this.state.diagnosisResult[key].prob * 100 + '%'}</div>
                    </div>
                );
            }
        }


        let config = cornerstoneTools.magnify.getConfiguration();

        let rotatePopover = (
            <Popover id="rotate-popover" className="popover-positioned-bottom">
                <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.flipViewport('HORIZONTAL')}>
                    <div style={{paddingBottom: '5px'}}>
                        <FontAwesome name='arrows-h' size='2x' />
                    </div>
                    <span>水平翻转</span>
                </div>
                <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.flipViewport('VERTICAL')}>
                    <div style={{paddingBottom: '5px'}}>
                        <FontAwesome name='arrows-v' size='2x' />
                    </div>
                    <span>垂直翻转</span>
                </div>
                <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.rotateViewport('COUNTERCLOCKWISE')}>
                    <div style={{paddingBottom: '5px'}}>
                        <FontAwesome name='rotate-left' size='2x' />
                    </div>
                    <span>向左旋转</span>
                </div>
                <div className="col-sm-3 rotate-menu-item" style={style.icon} onClick={() => this.rotateViewport('CLOCKWISE')}>
                    <div style={{paddingBottom: '5px'}}>
                        <FontAwesome name='rotate-right' size='2x' />
                    </div>
                    <span>向右旋转</span>
                </div>
            </Popover>
        );

        let magnifyPopover = (
            <Popover id="magnify-popover" className="popover-positioned-bottom">
                <div style={{marginBottom: '5px', textAlign: 'center'}}>倍数</div>
                <input id="magLevelRange" type="range" min="1" defaultValue={config.magnificationLevel} max="10" onChange={(evt) => {
                    let config = cornerstoneTools.magnify.getConfiguration();
                    config.magnificationLevel = parseInt(evt.target.value, 10);
                }}/>
                <br/>
                <div style={{marginBottom: '5px', textAlign: 'center'}}>尺寸</div>
                <input id="magSizeRange" type="range" min="100" defaultValue={config.magnifySize} max="300" step="25" onChange={(evt) => {
                    let config = cornerstoneTools.magnify.getConfiguration();
                    config.magnifySize = parseInt(evt.target.value, 10)
                    var magnify = document.getElementsByClassName("magnifyTool")[0];
                    magnify.width = config.magnifySize;
                    magnify.height = config.magnifySize;

                }}/>
            </Popover>
        );

        let rotateCaret = this.getCaret(this.state.isRotateMenuOpened),
            magnifyCaret = this.getCaret(this.state.isMagnifyToolOpened);

        let diagnosisBox = this.state.isLeftPanelOpened ? (
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
                    style={{zIndex: 2000, width: '100%', margin: '0 auto'}}
                />
            )
        ) : undefined;

        return (
            <div id="body" style={style.body}>
                <div id="top" style={style.top}>
                    <Navbar inverse collapseOnSelect style={{ marginBottom: '0'}}>
                        <Navbar.Collapse style={{minWidth: '1300px'}}>
                            <Nav onSelect={(selectedKey) => this.navSelectHandler(selectedKey)}>
                                <NavItem eventKey={1} href="#">
                                    <div style={style.icon} >
                                        <FontAwesome name='files-o' size='2x' />
                                    </div>
                                    <span>图层</span>
                                </NavItem>
                                <NavItem eventKey={2} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='sun-o' size='2x' />
                                    </div>
                                    <span>窗宽窗位</span>
                                </NavItem>
                                <NavItem eventKey={3} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='search' size='2x' />
                                    </div>
                                    <span>缩放</span>
                                </NavItem>
                                <NavItem eventKey={4} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='hand-paper-o' size='2x' />
                                    </div>
                                    <span>拖动</span>
                                </NavItem>
                            </Nav>
                            <Navbar.Text className="button" onClick={() => this.invertViewport()}>
                                <FontAwesome name='adjust' size='2x' />
                                <br />
                                <span>反色</span>
                            </Navbar.Text>
                            <Navbar.Text className="button">
                                <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={rotatePopover} onClick={() => this.toggleRotatePopover()} onExited={() => this.toggleRotatePopover()}>
                        <span>
                          <FontAwesome name='cog' size='2x' />
                          <br />
                          <span>旋转{rotateCaret}</span>
                        </span>
                                </OverlayTrigger>
                            </Navbar.Text>
                            <Navbar.Text className="button" onClick={this.resetViewport.bind(this)}>
                                <FontAwesome name='refresh' size='2x' /><br />
                                <span>重置</span>
                            </Navbar.Text>
                            <Navbar.Text style={{borderLeft: '2px solid #9ccef9', height: '50px'}}></Navbar.Text>
                            <Nav onSelect={(selectedKey) => this.navSelectHandler(selectedKey)}>
                                <NavItem eventKey={11} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='arrow-left' size='2x' />
                                    </div>
                                    <span>标注</span>
                                </NavItem>
                                <NavItem eventKey={5} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='arrows-h' size='2x' />
                                    </div>
                                    <span>测量</span>
                                </NavItem>
                                <NavItem eventKey={6} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='square-o' size='2x' />
                                    </div>
                                    <span>矩形</span>
                                </NavItem>
                                <NavItem eventKey={7} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='circle-o' size='2x' />
                                    </div>
                                    <span>圆点</span>
                                </NavItem>
                                <NavItem eventKey={8} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='chevron-down' size='2x' />
                                    </div>
                                    <span>角度</span>
                                </NavItem>
                                <NavItem eventKey={9} href="#">
                                    <div style={style.icon}>
                                        <FontAwesome name='sun-o' size='2x' />
                                    </div>
                                    <span>高亮</span>
                                </NavItem>
                                <NavItem eventKey={10} href="#">
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
                            <Navbar.Text className="button" onClick={() => this.clearToolData()}>
                                <FontAwesome name='trash' size='2x' />
                                <br />
                                <span>清除</span>
                            </Navbar.Text>
                            <Navbar.Text style={{borderLeft: '2px solid #9ccef9', height: '50px'}}></Navbar.Text>
                            <Navbar.Text className="button" onClick={this.saveState.bind(this)}>
                                <FontAwesome name='save' size='2x' />
                                <br />
                                <span>保存</span>
                            </Navbar.Text>
                            <Navbar.Text className="button" onClick={this.restoreState.bind(this)}>
                                <FontAwesome name='paste' size='2x' />
                                <br />
                                <span>载入</span>
                            </Navbar.Text>
                            <Navbar.Text className="button" onClick={this.switchState.bind(this)}>
                                <FontAwesome name={this.state.circleVisible ? 'eye-slash' : 'eye'} size='2x' />
                                <br />
                                <span>{this.state.circleVisible ? '隐藏' : '展示'}</span>
                            </Navbar.Text>
                            <Navbar.Text className="button" onClick={this.diagnose.bind(this)}>
                                <FontAwesome name='stethoscope' size='2x' />
                                <br />
                                <span>诊断</span>
                            </Navbar.Text>
                        </Navbar.Collapse>
                    </Navbar>
                </div>

                <div id="diagnosisInfo" style={{ ...style.diagnosisBox, ...{ height: this.state.containerHeight } }}>
                    {diagnosisBox}
                </div>

                <div id="outerContainer" style={{ ...style.container, ...{ height: this.state.containerHeight, width: this.state.containerWidth } }} className="container">
                    <input type={"range"}
                           id={"scrollbar"}
                           min={1}
                           max={this.state.imageNumber}
                           step={1}
                           onInput={this.onDragScrollBar}
                           style={{
                               ...style.scrollBar, ...{ width: this.state.containerHeight },
                               ...{ top: this.state.topValue }, ...{ right: this.state.rightValue }
                           }} />
                    <div style={style.viewer} ref="viewerContainer" id="viewer" >
                        <div style={{ ...style.patientInfo, ...style.textInfo, ...style.disableSelection }} id="patientInfo">
                            <div>
                                <span>病人姓名: {this.state.patientName}</span>
                                <br />
                                <span>病人id: {this.state.patientId}</span>
                            </div>
                        </div>
                        <div style={{ ...style.dicomInfo, ...style.textInfo, ...style.disableSelection }} id="dicomInfo">
                            <span className="pull-right">窗宽/窗位: {this.state.voi.windowWidth}/{this.state.voi.windowCenter}</span>
                            <br />
                            <span className="pull-right">缩放: {this.state.zoomScale}</span>
                        </div>
                        <div style={{ ...style.sliceInfo, ...style.textInfo, ...style.disableSelection }} id="sliceInfo">
                            <span className="pull-left">图像大小: {this.state.rows}*{this.state.cols}</span>
                            <br />
                            <span className="pull-left">层数: {this.state.index}/{this.state.imageNumber}</span>
                            <br />
                            <span className="pull-left">层厚: {this.state.thickness} 像素间距: {this.state.pixelSpacing}</span>

                        </div>
                        <div style={{ ...style.timeInfo, ...style.textInfo, ...style.disableSelection }} id="timeInfo">
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
