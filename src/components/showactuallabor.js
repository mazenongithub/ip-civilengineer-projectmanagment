import React, { Component } from 'react';
import { connect } from 'react-redux';
import * as actions from './actions';
import './invoices.css';
import {
    calculatetotalhours,
    inputUTCStringForLaborID
}
from './functions'
class ShowProjectActualLabor extends Component {

    constructor(props) {
        super(props);
        this.state = {
            width: 0,
            height: 0
        }
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }
    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);

    }


    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight });

    }
    showtitle() {
        let title = "";
        let myproject = this.getproject();
        title = `${myproject.projectid}/${myproject.title}`
        return title;
    }
    getproject() {
        let project = {};

        if (this.props.projects) {
            if (this.props.projects.hasOwnProperty("length")) {
                let projectid = this.props.projectid.projectid;
                // eslint-disable-next-line
                this.props.projects.map(myproject => {
                    if (myproject.projectid === projectid) {
                        project = myproject;
                    }
                })
            }
        }
        return project;
    }
    showlabor() {
        let labor = [];
        let myproject = this.getproject();
        if (myproject.hasOwnProperty("actuallabor")) {
            // eslint-disable-next-line
            myproject.actuallabor.mylabor.map(mylabor => {
                labor.push(this.showmylabor(mylabor))
            })
        }
        return labor;
    }
    showmylabor(mylabor) {
        let labor = [];
        if (this.state.width > 1080) {
            labor.push(<div className="invoice-row-large-a">From {inputUTCStringForLaborID(mylabor.timein)} to {inputUTCStringForLaborID(mylabor.timeout)} </div>)
            labor.push(<div className="invoice-row-large-b">{mylabor.description} </div>)
            labor.push(<div className="invoice-row-large-a">${Number(mylabor.laborrate).toFixed(2)}/Hr x {calculatetotalhours(mylabor.timeout,mylabor.timein)} Hrs = ${(Number(calculatetotalhours(mylabor.timeout,mylabor.timein)) * Number(mylabor.laborrate)).toFixed(2)} </div>)
        }
        else {
            labor.push(<div className="invoice-row-small-a">From {inputUTCStringForLaborID(mylabor.timein)} to {inputUTCStringForLaborID(mylabor.timeout)} </div>)
            labor.push(<div className="invoice-row-small-a">${Number(mylabor.laborrate).toFixed(2)}/Hr x {calculatetotalhours(mylabor.timeout,mylabor.timein)} Hrs = ${(Number(calculatetotalhours(mylabor.timeout,mylabor.timein)) * Number(mylabor.laborrate)).toFixed(2)} </div>)
            labor.push(<div className="invoice-row-small-b">{mylabor.description} </div>)
        }
        return (labor)
    }
    gettotalamount() {
        let myproject = this.getproject();
        let amount = 0;
        if (myproject.hasOwnProperty("actuallabor")) {
            // eslint-disable-next-line
            myproject.actuallabor.mylabor.map(mylabor => {
                amount += Number(calculatetotalhours(mylabor.timeout, mylabor.timein)) * Number(mylabor.laborrate)
            })
        }
        return amount;
    }
    render() {
        return (
            <div className="show-invoice-container">
        <div className="show-invoice-title">{this.showtitle()} <br/> Actual Labor</div>
        {this.showlabor()}
        <div className="invoice-amount-container">The Total Actual Labor ${this.gettotalamount().toFixed(2)} </div>
        </div>)

    }
}

function mapStateToProps(state) {
    return {
        myusermodel: state.myusermodel,
        projectid: state.projectid,
        projects: state.projects
    }
}

export default connect(mapStateToProps, actions)(ShowProjectActualLabor)
