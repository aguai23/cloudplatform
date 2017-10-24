import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { ToastContainer, toast } from 'react-toastify';

export default class Edit extends Component {


  showTeamStats() {
    this.props.showTeamStats();
  }

  editDataCollection(event) {
    event.preventDefault();

    let dataCollection = {
      _id: this.props.currentDataCollection._id,
      name: this.refs.name.value,
      type: this.refs.type.value,
      ownerId: Meteor.userId(),
    }

    Meteor.call('updateDataCollection', dataCollection, (error) => {
      if (error) {
        toast.error(`somethings wrong${error.reason}`, { position: toast.POSITION.BOTTOM_RIGHT });
      } else {
        toast.success(result.content, { position: toast.POSITION.BOTTOM_RIGHT });
        this.showTeamStats();
      }
    });
  }

  render() {

    const currentDataCollection = this.props.currentDataCollection;

    return (
      <div className="row">
        <form className="col s12" onSubmit={this.editDataCollection.bind(this)}>
          <h3>修改数据集名称</h3>

          <div className="row">
            <div className="input-field col s6">
              <input placeholder="名称" ref="name" type="text" className="validate" defaultValue={currentDataCollection.name} />
            </div>
            <div className="input-field col s6">
              <input placeholder="type" ref="type" type="text" className="validate" defaultValue={currentDataCollection.type} />
            </div>
            <button type="submit">提交</button>
          </div>
        </form>
        <ToastContainer
          position="bottom-right"
          type="info"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          style={toastStyle}
        />
      </div>
    )
  }
}
