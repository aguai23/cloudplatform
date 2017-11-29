import { Meteor } from 'meteor/meteor';
import React, { Component, PropTypes } from 'react';
import { DataCollections } from '../api/dataCollections';
import { Button, Checkbox, ControlLabel, Form, FormControl, Modal } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';

import './css/modalAddCollection.css';

export default class ModalAddCollection extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: this.props.showModal,
      isPublic: this.props.dataCollection ? this.props.dataCollection.type === 'PUBLIC' : false
    };
    this.onClickSubmit = this.onClickSubmit.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.showModal !== this.state.showModal) {
      this.setState({ showModal: nextProps.showModal });
    }
    if (nextProps.dataCollection) {
      this.setState({isPublic: nextProps.dataCollection.type === 'PUBLIC'});
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
    };

    if (!(this.name.value && this.equip.value)) {
      toast.error("请完善数据!");
      return
    }
    if (this.props.dataCollection) {
      dataCollection._id = this.props.dataCollection._id;
      Meteor.call('updateDataCollection', dataCollection, (error) => {
        if (error) {
          toast.error("Failed to modify collection. " + error.reason);
        } else {
          toast.success("数据集修改成功!");
        }
        this.setState({ showModal: false });
      })
    } else {
      let flag = DataCollections.findOne({ name: dataCollection.name })
      if (flag) {
        toast.error('该数据集已存在!')
      } else {
        Meteor.call('insertDataCollection', dataCollection, (error) => {
          if (error) {
            toast.error("Failed to add new collection. " + error.reason);
          } else {
            toast.success("数据集添加成功!");
          }
          this.setState({ showModal: false });
        });

      }
    }
  }

  render() {
    const oldData = this.props.dataCollection;
    return (
      <div>
        <Modal className="add-collection-modal" show={this.state.showModal} onHide={() => this.close()}>
          <Modal.Header className="add-collection-modal-header">
            <div>
              <Modal.Title className="add-collection-modal-title">{oldData ? `修改${oldData.name}` : '添加新'}数据集</Modal.Title>
            </div>
          </Modal.Header>
          <Modal.Body>
            <div>
              <Form horizontal>
                <ControlLabel>数据集名称</ControlLabel>
                <FormControl defaultValue={oldData ? oldData.name : ''} type="text" inputRef={(ref) => this.name = ref} />
                <ControlLabel>设备名称</ControlLabel>
                <FormControl defaultValue={oldData ? oldData.equip : ''} type="text" inputRef={(ref) => this.equip = ref} />
                <div className="last-row">
                  <div className="col-sm-3">
                    <Checkbox checked={this.state.isPublic} onChange={(evt) => { this.setState({ isPublic: evt.target.checked }); }}>设为公有</Checkbox>
                  </div>
                  <div className="col-sm-2 col-sm-offset-7">
                    <Button className="btn btn-primary pull-right" onClick={this.onClickSubmit}>提交</Button>
                  </div>
                </div>
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
          style={{ zIndex: 1999 }}
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
