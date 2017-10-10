import { Meteor } from 'meteor/meteor';
import React, { Component, PropTypes } from 'react';

import { Button, Checkbox, FieldGroup, Form, FormControl, FormGroup, Modal } from 'react-bootstrap';
import FontAwesome from 'react-fontawesome';
import { ToastContainer, toast } from 'react-toastify';


export default class ModalAddCollection extends Component{
  constructor(props) {
    super(props);

    this.state = {
      showModal: this.props.showModal,
      isPublic: false
    }
  }

  componentWillReceiveProps(nextProps) {
    // console.log(nextProps.showModal);
    if(nextProps.showModal !== this.state.showModal) {
      this.setState({showModal: nextProps.showModal});
    }
  }

  close() {
    this.setState({ showModal: false });
  }

  onClickSubmit() {
    let dataCollection = {
      name: this.name.value,
      equip: this.equip.value,
      ownerId: Meteor.userId(),
      type: this.state.isPublic ? 'PUBLIC' : 'PRIVATE'
    }

    // console.log("dataCollection", dataCollection);

    Meteor.call('insertDataCollection', dataCollection, (error) => {
      if (error) {
        console.log("Failed to add new collection. " + error.reason);
      } else {
        // console.log("Add new collection successfully");
        toast.success("数据集添加成功!");
      }
      this.setState({ showModal: false });
    });
  }

  render() {
    return (
      <div>
        <Modal show={this.state.showModal} onHide={() => this.close()}>
          <Modal.Header closeButton>
            <Modal.Title>添加新数据集</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              <Form horizontal>
                <FormControl type="text" placeholder="数据集名称" inputRef={(ref) => this.name=ref}/>
                <FormControl type="text" placeholder="设备" inputRef={(ref) => this.equip=ref}/>
                <Checkbox checked={this.state.isPublic} onChange={(evt)=>{this.setState({isPublic: evt.target.checked});}}>设为公有</Checkbox>
                <Button className="btn btn-success" onClick={() => this.onClickSubmit()}>提交</Button>
              </Form>
            </div>
          </Modal.Body>
        </Modal>

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
    );
  }

}

ModalAddCollection.PropTypes = {
  showModal: PropTypes.bool
};
