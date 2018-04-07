import React, { Component } from 'react'
import { withTracker } from 'meteor/react-meteor-data';
import { Button, Modal, Item, Header, Icon, Table, } from 'semantic-ui-react'

import { TakeSeriesTemplates } from '../api/takeSeriesTemplates.js';
import { TargetSessions } from '../api/targetSessions.js';
import { Seriess } from '../api/seriess.js';

import TakeSeriesTemplateEditor from './TakeSeriesTemplateEditor.js';

class TakeSeries extends Component {

  state = {
    editOpen: false,
    deleteFailed: false,
    targetsPreventingDelete: [],
  }

  editOpen = () => this.setState({ editOpen: true })
  editClose = () => this.setState({ editOpen: false })
  deleteFailedOpen = () => this.setState({ deleteFailed: true })
  deleteFailedClose = () => this.setState({ deleteFailed: false })

  deleteEntry() {
    // check if the series is used - if so cannot delete... list the Targets using it
    var sessions  = this.props.targetSessions;
    var targets = [];
    for (var i = 0; i < sessions.length; i++) {
      if( sessions[i].series._id == this.props.seriesTemplate._id) {
        targets.push(sessions[i]);
      }
    }
    if( targets.length>0 ) {
      this.setState({ targetsPreventingDelete: targets });
      this.deleteFailedOpen();
    }
    else {
      TakeSeriesTemplates.remove(this.props.seriesTemplate._id);
    }
  }

  editEntry() {
    console.log('In the DefineTemplate editEntry');
    this.editOpen();
  }

  copyEntry() {
    console.log('In the DefineTemplate editEntry');

    orgSeries = this.props.seriesTemplate;

    // get the id for the new object
    const id = TakeSeriesTemplates.insert(
      {
        name: orgSeries.name + ' Duplicated',
        description: orgSeries.description,
        processSeries: orgSeries.processSeries,
        repeatSeries: orgSeries.repeatSeries,
        createdAt: new Date(),
        series: [],
      }
    )

    var series = orgSeries.series;
    for (var i = 0; i < series.length; i++) {
      seriesMap = series[i];
      TakeSeriesTemplates.update({_id: id}, {
        $push: { 'series': seriesMap },
      });
    }
  }

  seriesDetails() {

    // CURRENTLY: 0:33x3s, 1:33x3s, 2:33x3s, 3:33x3s
    // WANT: LIGHT:LUM@33X3S

    var template = this.props.seriesTemplate;
    var seriesArray = template.series;
    var details = "";
    for (var i = 0; i < seriesArray.length; i++) {
      series = Seriess.findOne({_id:seriesArray[i].id});
      if(details != "") { details += ", "};
      details += series.frame +'-' + series.filter + ' for ' + series.repeat + 'x' + series.exposure + 's';
    }

    return details
  }

  render() {
//    <input type="checkbox" checked={!!this.props.takeSeriesTemplate.checked} name={this.props.takeSeriesTemplate.name} readOnly="" tabIndex="0" />
    return (
      <Item>
        <Item.Content>
          <Item.Header as='a'>
            {this.props.seriesTemplate.name}
          </Item.Header>
          <Item.Meta>
            {/* <Checkbox
              toggle
              checked={this.state.checked}
              onChange={this.onChangeChecked.bind(this)}
            /> */}
            {this.props.seriesTemplate.description}
          </Item.Meta>
          <Item.Description>
            {this.seriesDetails()}
          </Item.Description>
          <Item.Extra>
            <Button.Group basic size='small'>
              <Button icon='edit' onClick={this.editEntry.bind(this)}/>
              <Button icon='copy' onClick={this.copyEntry.bind(this)}/>
              <Button icon='delete' onClick={this.deleteEntry.bind(this)}/>
            </Button.Group>
            {/* *******************************
              Used to handle the Editing deleting of a series
              */}
            <Modal
              open={this.state.editOpen}
              onClose={this.editClose}
              closeIcon>
              <Modal.Header>Edit Series</Modal.Header>
              <Modal.Content>
                <Modal.Description>
                  <TakeSeriesTemplateEditor key={this.props.seriesTemplate._id} template={this.props.seriesTemplate}/>
                </Modal.Description>
              </Modal.Content>
            </Modal>
            {/* *******************************
              Used to handle the FAILED deleting of a series
              */}
            <Modal
              open={this.state.deleteFailed}
              onClose={this.deleteFailedClose.bind(this)}
              basic
              size='small'
              closeIcon>
              <Modal.Header>Delete Failed</Modal.Header>
              <Modal.Content>
                <h3>This series is used by a Target. Please change the target and try again:</h3>
                {this.state.targetsPreventingDelete.map( (target)=>{
                  return (
                      <li>
                        {target.name}
                      </li>
                  )
                })}
              </Modal.Content>
              <Modal.Actions>
                <Button color='red' onClick={this.deleteFailedClose.bind(this)} inverted>
                  <Icon name='stop' /> Got it
                </Button>
              </Modal.Actions>
            </Modal>
          </Item.Extra>
        </Item.Content>
      </Item>
    )
  }

}

export default withTracker(() => {
    return {
      seriess: Seriess.find({}, { sort: { order: 1 } }).fetch(),
      takeSeriesTemplates: TakeSeriesTemplates.find({}, { sort: { name: 1 } }).fetch(),
      targetSessions: TargetSessions.find({}, { sort: { name: 1 } }).fetch(),
  };
})(TakeSeries);
