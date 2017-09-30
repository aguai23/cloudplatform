import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { browserHistory } from 'react-router';
import { Cases } from '../api/cases';
import { Session } from "meteor/session";
import { List, Radio } from 'react-bootstrap'
export default class AddCase extends Component {
    constructor(props) {
        super(props);
        this.state = {
            collectionId: Session.get('collectionId')
        }
    }
    componentDidMount() {

    }

    submitDataCollection(event) {
        //prevent from refreshing
        event.preventDefault();

        let Case = {
            name: this.refs.name.value,
            type: this.refs.type.value,
            class: this.refs.class.value,
            label: this.refs.label.value,
            files: ['todo'],
            profile: { 
                gender: this.refs.gender,
                age: this.refs.age,
                source: this.refs.source,
                description: this.refs.description
             },
            collectionId: this.state.collectionId,
            ownerId: Meteor.userId(),
        }

        Meteor.call('insertCase', Case, (error) => {
            if (error) {
                alert("somethings wrong" + error.reason);
            } else {
                alert("Case added");
                browserHistory.push('/datasets');
            }
        });
    }

    render() {
        return (
            <div className="container">
                <form onSubmit={this.submitDataCollection.bind(this)}>
                    <h3>Add a new case{this.state.user}</h3>
                    <div className="row">
                        <div className="input-field col s4">
                            <label>病例名称</label>
                            <input placeholder="" ref="name" type="text" className="validate" />
                        </div>
                        <div className="input-field col s4">
                            <label>种类</label>
                            <input placeholder="" ref="type" type="text" className="validate" />
                        </div>
                        <div className="input-field col s4">
                            <label>类别</label>
                            <input placeholder="" ref="class" type="text" className="validate" />
                        </div>
                    </div>
                    <div className="row">
                        <div className="input-field col s4">
                            <label>标签</label>
                            <input placeholder="" ref="label" type="text" className="validate" />
                        </div>
                        <div className="input-field col s4">
                            <label>图片</label>
                            <input ref="files" type="file" className="validate" />
                        </div>
                    </div>
                    <div className="row">
                        <label>病患信息</label>
                        <label>性别: &nbsp;&nbsp;
                            <input name="gender" ref="label1" type="radio" />男 &nbsp;&nbsp;
                            <input name="gender" ref="label2" type="radio" />女
                        </label>
                    </div>
                    <div className="row">
                        <label>年龄: &nbsp;&nbsp;
                            <input type="number" ref="age" />
                        </label>
                    </div>
                    <div className="row">
                        <label>来源: &nbsp;&nbsp;
                            <input type="text" ref="source" />
                        </label>
                    </div>
                    <div className="row">
                        <label>描述: &nbsp;&nbsp;
                            <input type="text" ref="description" />
                        </label>
                    </div>
                    <div className="row">
                        <div className="input-field col s6">
                            <button type="submit" name="action" className="btn btn-success">Submit</button>
                        </div>
                    </div>
                </form>
            </div>
        )
    }
}

AddCase.contextTypes = {
    router: React.PropTypes.object
}
