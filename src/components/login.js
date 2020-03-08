import React, { Component } from 'react';
import { connect } from 'react-redux';
import { GoogleSigninIcon, loginNowIcon, AppleSigninIcon } from './svg';
import * as actions from './actions';
import './login.css';
import { ClientLogin } from './actions/api';
import Profile from './profile';
import PM from './pm'
import firebase from 'firebase';
import { returnCompanyList } from './functions'
import { MyStylesheet } from './styles'


class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            message: "",
            windowWidth: 0,
            client: '',
            clientid: '',
            firstname: '',
            lastname: '',
            emailaddress: '',
            profileurl: '',
            phonenumber: '',
            pass: '',
        }
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }
    componentDidMount() {

        window.addEventListener('resize', this.updateWindowDimensions);
        this.props.reduxNavigation({ navigation: "login" })
        let windowwidth = window.innerWidth;
        let message = ""
        if (this.props.hasOwnProperty("match")) {
            if (this.props.match.hasOwnProperty("params")) {
                if (this.props.match.params.hasOwnProperty("message")) {


                    message = this.props.match.params.message




                }
            }
        }
        this.setState({ message, windowwidth })

    }


    async appleSignIn() {
        let provider = new firebase.auth.OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        try {
            let result = await firebase.auth().signInWithPopup(provider)
            // The signed-in user info.
            var user = result.user;
            console.log(user)
            let firstname = "";
            let lastname = "";
            if (user.providerData[0].displayName) {
                firstname = user.providerData[0].displayName.split(' ')[0]
                lastname = user.providerData[0].displayName.split(' ')[1]
            }
            let phonenumber = user.providerData[0].phoneNumber
            let profileurl = user.providerData[0].photoURL;
            let client = 'apple';
            let clientid = user.providerData[0].uid;
            let emailaddress = user.providerData[0].email;

            if (emailaddress && clientid && client) {
                try {

                    let values = { client, clientid, firstname, lastname, emailaddress, profileurl, phonenumber }
                    const response = await ClientLogin(values);
                    console.log(response)
                    if (response.hasOwnProperty("allusers")) {
                        let companys = returnCompanyList(response.allusers);
                        this.props.reduxAllCompanys(companys)
                        this.props.reduxAllUsers(response.allusers);
                        delete response.allusers;

                    }
                    if (response.hasOwnProperty("providerid")) {
                        this.props.reduxUser(response)
                    }
                    if (response.hasOwnProperty("message")) {
                        this.setState({ message: response.message })
                    }
                } catch (err) {
                    alert(err)
                }

            } else {
                this.setState({ client, clientid, firstname, lastname, emailaddress, profileurl, phonenumber })
            }


            // ...
        } catch (err) {
            alert(err)
            // ...
        };


    }




    updateWindowDimensions() {
        let windowwidth = window.innerWidth;
        this.setState({ windowwidth })
    }
    handleSubmit(event) {
        if (this.props.emailaddress.hasOwnProperty("errmsg") || this.props.password.hasOwnProperty("errmsg")) {
            event.preventDefault();
            let message = "";
            if (this.props.emailaddress.hasOwnProperty("errmsg")) {
                message += this.props.emailaddress.errmsg
            }
            if (this.props.password.hasOwnProperty("errmsg")) {
                message += ` ${this.props.password.errmsg}`
            }
            this.setState({ message })
        }
        return

    }
    showextrarow() {
        if (this.state.windowwidth > 720 && this.state.windowwidth < 1080) {

            return (<div className="login-buttonrow">
                &nbsp; </div>)
        }
    }
    showmessagerow() {

    }

    getLoginMessage() {
        let message;
        if (this.props.hasOwnProperty("match")) {
            if (this.props.match.hasOwnProperty("params")) {
                message = this.props.match.params.message;
            }
        }
        return message;
    }

    async loginuser() {
        try {


            let emailaddress = this.state.emailaddress;
            let pass = this.state.pass;
            let clientid = this.state.clientid;
            let client = this.state.client;
            let values = { emailaddress, pass, clientid, client }
            const response = await ClientLogin(values);
            console.log(response)
            if (response.hasOwnProperty("allusers")) {
                let companys = returnCompanyList(response.allusers);
                this.props.reduxAllCompanys(companys)
                this.props.reduxAllUsers(response.allusers);

            }
            if (response.hasOwnProperty("myuser")) {

                this.props.reduxUser(response.myuser)
            }
            if (response.hasOwnProperty("message")) {
                this.setState({ message: response.message })
            }
        } catch (err) {
            alert(err)
        }
    }

    async clientlogin() {
        try {

            let client = this.state.client;
            let clientid = this.state.clientid;
            let firstname = this.state.firstname;
            let lastname = this.state.lastname;
            let emailaddress = this.state.emailaddress;
            let profileurl = this.state.profileurl;
            let phonenumber = this.state.phonumber;
            let providerid = this.state.providerid;
            let values = { client, clientid, firstname, lastname, emailaddress, profileurl, phonenumber, providerid }
            const response = await ClientLogin(values);
            console.log(response)
            if (response.hasOwnProperty("allusers")) {
                let companys = returnCompanyList(response.allusers);
                this.props.reduxAllCompanys(companys)
                this.props.reduxAllUsers(response.allusers);
                delete response.allusers;

            }
            if (response.hasOwnProperty("providerid")) {
                this.props.reduxUser(response)
            }
            if (response.hasOwnProperty("message")) {
                this.setState({ message: response.message })
            }
        } catch (err) {
            alert(err)
        }
    }
    async googleSignIn() {


        try {


            let provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            let result = await firebase.auth().signInWithPopup(provider)
            var user = result.user;
            let client = 'google';
            let clientid = user.providerData[0].uid;
            let firstname = '';
            if (user.providerData[0].displayName) {
                firstname = user.providerData[0].displayName.split(' ')[0]
            }

            let lastname = '';
            if (user.providerData[0].displayName) {
                lastname = user.providerData[0].displayName.split(' ')[1]
            }
            let emailaddress = user.providerData[0].email;
            let profileurl = user.providerData[0].photoURL;
            let phonenumber = user.phoneNumber;

            if (emailaddress && clientid && client) {
                try {


                    let values = { client, clientid, firstname, lastname, emailaddress, profileurl, phonenumber }
                    const response = await ClientLogin(values);
                    console.log(response)
                    if (response.hasOwnProperty("allusers")) {
                        let companys = returnCompanyList(response.allusers);
                        this.props.reduxAllCompanys(companys)
                        this.props.reduxAllUsers(response.allusers);
                        delete response.allusers;

                    }
                    if (response.hasOwnProperty("providerid")) {
                        this.props.reduxUser(response)
                    }
                    if (response.hasOwnProperty("message")) {
                        this.setState({ message: response.message })
                    }
                } catch (err) {
                    alert(err)
                }

            } else {
                this.setState({ client, clientid, firstname, lastname, emailaddress, profileurl, phonenumber })
            }





        } catch (error) {
            alert(error)
        }




    }
    handleloginicon() {
        const pm = new PM();
        const styles = MyStylesheet();
        const projectIcon = pm.getsaveprojecticon.call(this)
        if (this.state.client && this.state.clientid && this.state.providerid) {
            return (<div style={{ ...styles.generalFlex }}>
                <div style={{ ...styles.flex1, ...styles.generalFont, ...styles.alignCenter }}>
                    <button style={{ ...styles.generalButton, ...projectIcon }} onClick={() => { this.clientlogin() }}>
                        {loginNowIcon()}
                    </button>
                </div>
            </div>)
        } else if (this.state.emailaddress && this.state.pass) {
            return (<div style={{ ...styles.generalFlex }}>
                <div style={{ ...styles.flex1, ...styles.generalFont, ...styles.alignCenter }}>
                    <button style={{ ...styles.generalButton, ...projectIcon }} onClick={() => { this.loginuser() }}>
                        {loginNowIcon()}
                    </button>
                </div>
            </div>)
        }
    }
    render() {
        let pm = new PM();
        let myuser = pm.getuser.call(this);
        const styles = MyStylesheet();
        const regularFont = pm.getRegularFont.call(this)
        const showpassword = () => {
            if (!this.state.client && !this.state.clientid) {

                return (<div style={{ ...styles.generalFlex, ...styles.bottomMargin15 }}>
                    <div style={{ ...styles.flex1, ...styles.generalFont, ...regularFont }}>
                        Password
                        </div>
                    <div style={{ ...styles.flex2, ...styles.generalFont, ...regularFont }}>
                        <input type="password" name="pass" style={{ ...styles.generalField, ...regularFont }}
                            value={this.state.pass}
                            onChange={event => { this.setState({ pass: event.target.value }) }}
                        />
                    </div>
                </div>)
            } else {
                return;
            }
        }
        const Login = () => {



            return (
                <div className="general-flex">
                    <div className="flex-1 general-container">

                        <div className="general-flex">
                            <div className="flex-1 general-container">
                                <div className="flex-1 general-container login-aligncenter titleFont">
                                    Login
                                </div>
                            </div>
                        </div>

                        <div className="general-flex">
                            <div className="flex-1 general-container">

                                <div className="flex-1 general-container login-aligncenter titleFont">
                                    <button className="btnclientlogin general-button" onClick={() => { this.googleSignIn() }}>
                                        {GoogleSigninIcon()}
                                    </button>
                                </div>

                            </div>
                        </div>

                        <div className="general-flex">
                            <div className="flex-1 general-container">
                                <div className="flex-1 general-container login-aligncenter titleFont">
                                    <button className="btnclientlogin general-button" onClick={() => { this.appleSignIn() }}>
                                        {AppleSigninIcon()}
                                    </button>
                                </div>
                            </div>
                        </div>


                        <div style={{ ...styles.generalFlex, ...styles.bottomMargin15 }}>
                            <div style={{ ...styles.flex1, ...styles.generalFont, ...regularFont }}>
                                Email
                            </div>
                            <div style={{ ...styles.flex2, ...styles.generalFont, ...regularFont }}>
                                <input type="text" name="emailaddress" style={{ ...styles.generalField, ...regularFont, ...styles.generalFont }}
                                    value={this.state.emailaddress}
                                    onChange={event => { this.setState({ emailaddress: event.target.value }) }} />
                            </div>
                        </div>

                        {showpassword()}

                        <div style={{ ...styles.generalFlex }}>
                            <div style={{ ...styles.flex1, ...styles.generalFont, ...styles.alignCenter, ...regularFont }}>
                                {this.state.message}
                            </div>
                        </div>

                        {this.handleloginicon()}





                    </div>
                </div>)
        }
        if (myuser) {
            return (<Profile />)
        } else {
            return (Login())
        }



    }
}

function mapStateToProps(state) {
    return {
        myusermodel: state.myusermodel,
        navigation: state.navigation,
        project: state.project,
        allusers: state.allusers,
        allcompanys: state.allcompanys
    }
}

export default connect(mapStateToProps, actions)(Login);
