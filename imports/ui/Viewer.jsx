import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Button, Navbar, NavItem, Nav, NavDropdown, MenuItem, Jumbotron } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import cornerstone from 'cornerstone-core';

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
    backgroundColor: 'black'
  },
  dicomInfo: {
    position: 'absolute',
    top: '0px',
    right: '0px',
    height: '100px',
    width: '100px',
    backgroundColor: 'orange'
  },
  number: {
    position: 'absolute',
    bottom: '0px',
    left: '0px',
    height: '100px',
    width: '100px',
    backgroundColor: 'black'
  },
  timeInfo: {
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    height: '100px',
    width: '100px',
    backgroundColor: 'orange'
  }

}

export default class Viewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      container: {},
      dicomObj: {}
    }
    // console.log(this.state.dicomObj)
    this.setSlice = this.setSlice.bind(this);
  }
  componentDidMount() {
    cornerstone.enable(ReactDOM.findDOMNode(this.refs.viewerContainer))
    this.setState({
      container: ReactDOM.findDOMNode(this.refs.viewerContainer)
    });
    let that = this;
    Meteor.call('prepareDicoms', this.props.location.query.caseId, (error) => {
      if (error) {
        console.log(error)
      } else {
        that.setSlice(1)
      }
    })
  }

  setSlice(index) {
    // console.log(this.state.dicomObj)
    if (!this.state.dicomObj[index]) {
      Meteor.call('getDicom', index, (err, result) => {
        let image = result;
        // console.log(image)

        let pixelDataElement = image.pixelData;
        let pixelData = new Uint16Array(image.imageBuf.buffer, image.pixelDataOffset, image.pixelDataLength / 2);
        image.getPixelData = function(){
          return pixelData
        }
        let currentObj = this.state.dicomObj
        currentObj[index] = image
        this.setState({
          dicomObj: currentObj
        })
        console.log(this.state.dicomObj)
        cornerstone.displayImage(this.state.container, this.state.dicomObj[index])
      })
    } else {
      cornerstone.displayImage(this.state.container, this.state.dicomObj[index])
    }
  }

  render() {
    return (
      <div id="body">
        <div style={style.top}>
          <Navbar inverse collapseOnSelect>
            <Navbar.Collapse>
              <Nav>
                <NavItem eventKey={1} href="#">scroll</NavItem>
                <NavItem eventKey={2} href="#">wl/wc</NavItem>
                <NavItem eventKey={3} href="#">zoom/pan</NavItem>
                <NavItem eventKey={4} href="#">draw</NavItem>
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
