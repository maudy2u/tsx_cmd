/*
tsx cmd - A web page to send commands to TheSkyX server
    Copyright (C) 2018  Stephen Townsend

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react';
import TrackerReact from 'meteor/ultimatejs:tracker-react'
// import ReactDOM from 'react-dom';
// import { Session } from 'meteor/session'
// import {mount} from 'react-mounter';

// used for log files
import { Logger }     from 'meteor/ostrio:logger';
import { LoggerFile } from 'meteor/ostrio:loggerfile';
import { withTracker } from 'meteor/react-meteor-data';

import {
  Table,
  Grid,
  Dimmer,
  Segment,
  Loader,
  Header,
  Input,
  Divider,
  Button,
  Label,
} from 'semantic-ui-react'

// Import the API Model
import {
  TakeSeriesTemplates,
  addNewTakeSeriesTemplate,
  takeSeriesDropDown,
} from '../api/takeSeriesTemplates.js';
import {
  TargetSessions,
  addNewTargetSession,
} from '../api/targetSessions.js';
import {
  TargetReports
} from '../api/targetReports.js'
import {
  TargetAngles
} from '../api/targetAngles.js'

import { Filters } from '../api/filters.js';
import { FlatSeries } from '../api/flatSeries.js';
import { TheSkyXInfos } from '../api/theSkyXInfos.js';
import { AppLogsDB } from '../api/theLoggers.js'

import {
  tsx_ServerStates,
  tsx_UpdateServerState,
  saveDefaultStateValue,
  UpdateStatus,
  // tsx_GetServerState,
} from  '../api/serverStates.js';

import {
  formatDate,
  formatDateTime,
} from '../api/time_utils.js'

import TargetConstraints from './TargetConstraints.js'

// App component - represents the whole app
class NightPlanner extends Component {

  constructor(props) {
    super(props);

    this.state = {
        planData: [],
        night_plan: '',
        night_plan_reset: true,
        plan_is_updating: false,
    };
    // Methods to pass as properties
    this.loadPlanData = this.loadPlanData.bind(this);
  }

  handleToggle = (e, { name, value }) => this.setState({ [name]: Boolean(!eval('this.state.'+name)) })

  handleToggleAndSave = (e, { name, value }) => {
    var val = eval( 'this.state.' + name);

    this.setState({
      [name]: !val
    });
    saveDefaultStateValue( name, !val );
  };

  componentDidMount(prevProps) {
    if( typeof this.props == 'undefined') return;
    if( typeof this.props.night_plan_reset == 'undefined' ) return;
    this.setState({
        night_plan_reset: this.props.night_plan_reset,
    })
  }

  // Pass through function.
  night_plan_is_updating = () => {
    this.loadPlanData();
  }


  propValue( prop ) {
    let val = '';
    try {
      val = prop.value;
    }
    catch( e ) {
      val = ''
    }
    return val;
  }


  adjHour( hr, limit ) {
    if( hr <= limit ) {
      hr = hr + 24;
    }
    return hr;
  }

  // *******************************
  // Night planner
  loadPlanData() {

    // these are all working methods
    // on the client
    var RUNNING = '';
    var ACTIVE = false;
    try {
      RUNNING = this.props.scheduler_running.value;
      ACTIVE = this.props.tool_active.value;
    } catch (e) {
      RUNNING = '';
      ACTIVE = false;
    }

    var RELOAD = true;
    if( RUNNING == 'Stop'  && ACTIVE == false ){
      RELOAD = false;
    }

    // If scheduler is running then reload the report
    // Cannot query TheSkyX if imaging... yet...
    if( RELOAD ) {
      let result = [];
      try {
        // It is possible there is no plan to load...
        result = TheSkyXInfos.findOne({name: 'NightPlan'});
      }
      catch(e) {
        // no plan so do not process
        result === '';
        this.setState({
          planData: '',
          night_plan_reset: true,
        });
      }
      if( typeof result !== 'undefined' || result !== '') {
        this.setState({
          planData: result,
          night_plan_reset: false,
        });
      }
    }
    else {
      this.setState({
        plan_is_updating: true,
      })
      Meteor.call("planData", function (error, result) {
        if( typeof error == 'undefined' ) {
          // identify the error
          this.setState({
            planData: result,
            night_plan_reset: false,
            plan_is_updating: false,
          });
        }
      }.bind(this));
    }
  }

  // *******************************
  // Create the Target Table Data
  renderTargetRow( DATA, colHours ) {

    let Out = [];
    for( let i=0; i<DATA.length; i ++ ) {
      let obj = DATA[i];
      if( typeof obj == 'undefined' ) {
        continue;
      }
      let oName = obj.target;
      if( oName == 'Sun' || oName == 'Moon') {
        continue;
      }
      // *******************************
      // realy target to work with
      let target = TargetSessions.findOne({_id:obj.passthru});
      if( typeof target != 'undefined' && target != '') {
        let nam = target.friendlyName;
        if( typeof nam != 'undefined' && nam != '') {
          oName = nam;
        }
      }
      else {
        continue;
      }
      let alt = obj.alt;
      let sTime = obj.start;
      let eTime = obj.end;
      let rise = obj.alt_start;
      let down = obj.alt_end;
      let ref =obj.passthru;
      let priority = target.priority;

      let COL = [];
      // only do the planner number of cols
      let hrLimit = colHours[colHours.length-1];
      let startHr=0,endHr=0,rHr=0,dHr=0;
      try {
        startHr = this.adjHour( Number(sTime.split(':')[0].trim()), hrLimit );
        endHr = this.adjHour( Number(eTime.split(':')[0].trim()), hrLimit );
        rHr = this.adjHour( Number(rise.split(':')[0].trim()), hrLimit );
        dHr = this.adjHour( Number(down.split(':')[0].trim()), hrLimit );
        if( dHr < rHr ) {
          dHr = dHr + 24;
        }
        if( endHr < startHr ) {
          endHr = endHr + 24;
        }
        // console.log(
        //    'HR: ' + hr + ', OBJ: ' + oName + ',ALT: ' + alt + ',S: ' + startHr + ',E: ' + endHr + ',R: ' + rHr + ',D: ' + dHr
        // )
      }
      catch( e ) {
        startHr = 0;
        endHr = 0;
        rHr = 0;
        dHr = 0;
      }

      for( let j=0; j< colHours.length; j++ ) {
        let colour = 'black';
        let hr = this.adjHour( colHours[j], hrLimit );
        if(
          ( hr >= startHr && hr >= rHr )
          &&
          ( hr <= endHr && hr <= dHr )
        ) {
          colour = 'green';
        }
        var note = '';
        const priorityColours = [
          'green',
          'teal',
          'blue',
          'olive',
          'violet',
          'purple',
          'pink',
          'brown',
          'grey',
          'black',
          'red',
          'orange',
          'yellow',
        ];

        if( j == 0 ) {
          note = oName;
          if( hr >= rHr ) {
            note = note + ' ['+rise+']';
          }
          COL.push(
            <Table.Cell textAlign={'left'} key={j} style={{ backgroundColor: colour, color: 'white'  }}>
              <Label circular color={priorityColours[priority]}>{priority}</Label>
              <small>{note}</small>
            </Table.Cell>
          );
          continue;
        }
        else if( hr == rHr ) {
          note = rise;
        }
        else if( hr == startHr ) {
          note = sTime;
        }
        else if( hr == dHr ) {
          note = down;
        }
        else if( hr == endHr ) {
          note = eTime;
        }

        COL.push(
          <Table.Cell textAlign={'center'} key={j} style={{ backgroundColor: colour, color: 'white'  }}>
              <small>{note}</small>
          </Table.Cell>
        );
      }
      Out.push(
        <Table.Row key={ref}>
          {COL}
        </Table.Row>
      )
    }
    return Out;
  }

  // shouldComponentUpdate(nextProps, nextState)  {
  //
  // }

  render() {
    // if( this.props.night_plan_reset) {
    //   this.loadPlanData();
    // }

    // pop up the upload dialog
    // send the file to server
    // server parses file "key=value"

    // get the time for the sun at Altitiude above and below
    // repeat for each enabled target
    // rows for start and end times....
    let PLAN = [];
    var DISABLE = true;
    var NOT_DISABLE = false;

    // then use as needed disabled={DISABLE} or disabled={NOT_DISABLE}
    if( this.props.scheduler_running.value === 'Stop' && this.props.tool_active.value === false ){
      DISABLE = false;
      NOT_DISABLE = true;
    }

    try {
      PLAN = this.props.night_plan.value;
    }
    catch( e ) {
      PLAN = [];
      return;
    }

    const STARTTIME = this.propValue(this.props.tsxInfo.find(function(element) {
      return element.name == 'defaultStartTime';
    }));
    const ENDTIME = this.propValue(this.props.tsxInfo.find(function(element) {
      return element.name == 'defaultStopTime';
    }));

    /*
    // Sun: use white for day light, and blue for night
    // Moon: use blue during Moon UP
    // Nautical Twilight is 12 degree below horizon -12, or use the time user set
    // Target: use white for no imaging, and green for imaging
    const possibleColors = [
      'red',
      'orange',
      'yellow',
      'olive',
      'green', // Target imaging time
      'teal', // Before/After start/end time
      'blue', // Moon is UP
      'violet',
      'purple',
      'pink',
      'brown',
      'grey',
      'black', // dark
    ];
    */
    let startHr=0, endHr=0,  bufHr = 1;

    try {
      startHr = Number(STARTTIME.split(':')[0].trim());
      endHr = Number(ENDTIME.split(':')[0].trim());
    }
    catch( e ) {
      startHr = 0;
      endHr = 0;
    }

    //CREATE THE HOUR GRID FOR THE TABLE
    let plannerIndex = [];
    if( startHr-bufHr < 24 && startHr-bufHr > endHr+bufHr ) {
        for( var i=startHr-bufHr; i < 24; i++ ) {
          plannerIndex.push( i );
        }
    }
    if( endHr+bufHr == 0 || endHr+bufHr < startHr-bufHr ) {
      for( var i=0; i < endHr+bufHr; i++ ) {
        plannerIndex.push( i );
      }
    }

    // *******************************
    // GET SUN and MOON data
    let MOONRISE= '0:0';
    let MOONRISE_HR= 0;
    let MOONSET = '0:0';
    let MOONSET_HR = 0;
    let SUNRISE= '0:0';
    let SUNRISE_HR= 0;
    let SUNSET = '0:0';
    let SUNSET_HR = 0;
    for( var i=0; i<PLAN.length; i ++ ) {
      let obj = PLAN[i];
      if( typeof obj == 'undefined' ) {
        continue;
      }
      let oName = obj.target;
      if( oName == 'Moon') {
        let alt = obj.alt;
        let sTime = obj.start;
        let eTime = obj.end;
        MOONRISE = obj.alt_start;
        MOONSET = obj.alt_end;
        MOONRISE_HR = Number(MOONRISE.split(':')[0].trim());
        MOONSET_HR = Number(MOONSET.split(':')[0].trim());

        let hrLimit = plannerIndex[plannerIndex.length-1];
        MOONRISE_HR = this.adjHour( MOONRISE_HR, hrLimit );
        MOONSET_HR = this.adjHour( MOONSET_HR, hrLimit );
        if( MOONSET_HR < MOONRISE_HR ) {
          MOONSET_HR = MOONSET_HR + 24;
        }
        if(MOONSET_HR < 12 ) {
          MOONSET_HR=MOONSET_HR+24;
        }
      }
      else if( oName == 'Sun') {
        let alt = obj.alt;
        let sTime = obj.start;
        let eTime = obj.end;
        SUNRISE = obj.alt_start;
        SUNSET = obj.alt_end;
        SUNRISE_HR = Number(SUNRISE.split(':')[0].trim());
        SUNSET_HR = Number(SUNSET.split(':')[0].trim());

        let hrLimit = plannerIndex[plannerIndex.length-1];
        if(SUNRISE_HR < 12 ) {
          SUNRISE_HR=SUNRISE_HR+24;
        }
        SUNSET_HR = this.adjHour( SUNSET_HR, hrLimit );
      }

    }

    // *******************************
    // createt the GRID
    let colHours = [];
    let planner = [];

    // *******************************
    // setup first half
    if( startHr-bufHr < 24 && startHr-bufHr > endHr+bufHr ) {
        for( var k=startHr-bufHr; k < 24; k++ ) {
          colHours.push( k );
          let colour = 'black';
          // Colour the Moon
          if( k >= MOONRISE_HR && k <= MOONSET_HR) {
            colour = 'blue';
          }
          // Colour the Sun
          if( k <= SUNSET_HR ) {
             colour = 'teal';
          }
          // if( (k < startHr || k > endHr) ) {
          //   colour = 'teal';
          // }

          let note = k;
          if( k == MOONRISE_HR ) {
            note = MOONRISE;
          }
          else if( k == MOONSET_HR ) {
            note = MOONSET;
          }
          else if( k == SUNRISE_HR ) {
            note = SUNRISE;
          }
          else if( k == SUNSET_HR ) {
            note = SUNSET;
          }

          // add in moonlight hour colouring...
          // i.e. if within the moonrise hours... make text Colours XXX
          planner.push(
            <Table.HeaderCell textAlign={'center'} key={k} style={{ backgroundColor: colour, color: 'white'  }}>
                <small>{note}</small>
            </Table.HeaderCell>
          );
        }
    }
    // *******************************
    // setup last half
    if( endHr+bufHr == 0 || endHr+bufHr < startHr-bufHr ) {
      for( let j=0; j < endHr+bufHr; j++ ) {
        colHours.push( j );
        let colour = 'black';
        // if( j > endHr ) {
        //   colour = 'teal';
        // }
        // Colour the Moon
        if( j+24 >= MOONRISE_HR && j+24 <= MOONSET_HR) {
          colour = 'blue';
        }
        // Colour the Sun
        if( j+24 >= SUNRISE_HR ) {
           colour = 'teal';
        }

        let note = j;
        if( j+24 == MOONRISE_HR ) {
          note = MOONRISE;
        }
        else if( j+24 == MOONSET_HR ) {
          note = MOONSET;
        }
        else if( j+24 == SUNRISE_HR ) {
          note = SUNRISE;
        }

        planner.push(
          <Table.HeaderCell textAlign={'center'} key={j} style={{ backgroundColor: colour, color: 'white' }}>
            <small>{note}</small>
          </Table.HeaderCell>
        );
      }
    }

    var data = this.props.night_plan;
    const plan_date = this.props.night_plan.timestamp;

    return (
      <div>
        <Button disabled={DISABLE} icon='refresh' loading={this.state.plan_is_updating} labelPosition='left' onClick={this.loadPlanData.bind(this)} label='Refresh Plan'/>
        <Segment secondary>
          <Header>Night Plan - {formatDateTime(plan_date)} </Header>
          <center>
            <small><font color="black">Defaults: start time={STARTTIME}, end time={ENDTIME}; Teal=Twilight, Blue=Moon, Green=Imaging</font><br/>
            </small>
          </center>
          <Table celled compact basic unstackable>
            <Table.Header>
              <Table.Row>
                {planner}
              </Table.Row>
            </Table.Header>
            <Table.Body>
            {this.renderTargetRow( PLAN, colHours )}
            </Table.Body>
          </Table>
        </Segment>
        <Table celled compact basic unstackable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell content={'Target'+' Description'}/>
              <Table.HeaderCell content={'TakeSeries'}/>
              <Table.HeaderCell content='Max Alt.'/>
              <Table.HeaderCell content='Min Alt.'/>
              <Table.HeaderCell content='Start'/>
              <Table.HeaderCell content='Stop'/>
              <Table.HeaderCell content='Priority'/>
            </Table.Row>
          </Table.Header>
          <Table.Body>
          {this.props.enabledtargets.map((obj)=>{
            return (
              <TargetConstraints
                key={obj._id}
                targetPlan={obj}
                night_plan_is_updating={this.night_plan_is_updating}
                scheduler_running={this.props.scheduler_running}
                tool_active = {this.props.tool_active}
                dirty = {obj.report.dirty}
                plan_is_updating={this.state.plan_is_updating}
              />
            )
          })}
          </Table.Body>
        </Table>
      </div>
    )
  }
}

export default withTracker(() => {
    return {
  };
})(NightPlanner);
