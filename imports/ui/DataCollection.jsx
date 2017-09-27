import React, { Component } from 'react';
import { Card, CardMedia, CardTitle, CardText, CardActions } from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import Avatar from 'material-ui/Avatar';
import Chip from 'material-ui/Chip';
import { blue200, lightBlue800, lightBlue50 } from 'material-ui/styles/colors';

const styles = {
  chip: {
    margin: 4,
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  button: {
    margin: 12

  }
}


export default class Player extends Component {
  showEditForm() {
    this.props.showEditForm();
  }

  render() {
    const dataCollection = this.props.dataCollection;

    return (
      <Card>

        <CardMedia
          overlay={<CardTitle title={dataCollection.name} />}>
          <img src="messi.jpg" />
        </CardMedia>
        <CardText>
        </CardText>
        <CardActions>
          <RaisedButton label="Edit dataCollection/stats"
            labelPosition="before"
            style={styles.button}
            onClick={this.showEditForm.bind(this)} />
        </CardActions>
      </Card>
    )
  }
}
