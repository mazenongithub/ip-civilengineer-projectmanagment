import React, { Component } from 'react';
import * as actions from './actions';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { MyStylesheet } from './styles';
import { sorttimes, DirectCostForLabor, ProfitForLabor, DirectCostForMaterial, ProfitForMaterial, DirectCostForEquipment, ProfitForEquipment, CreateBidScheduleItem, UTCStringFormatDateforProposal, inputUTCStringForLaborID } from './functions'
import PM from './pm';
import StripeCheckout from 'react-stripe-checkout';
import { payInvoice } from './actions/api'


class ViewInvoice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            render: '',
            width: 0,
            height: 0,
            message: ""
        }

        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);

    }
    componentDidMount() {

        this.updateWindowDimensions()
        this.props.reduxNavigation({ navigation: "viewinvoice", invoiceid: this.props.match.params.invoiceid })
        this.props.reduxProject({ projectid: this.props.match.params.projectid })


    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowDimensions);
    }
    updateWindowDimensions() {
        this.setState({ width: window.innerWidth, height: window.innerHeight });

    }
    invoiceitemsbycsiid(csiid) {
        const invoiceid = this.props.match.params.invoiceid;
        const pm = new PM();
        let myproject = pm.getproject.call(this);
        let items = [];
        if (myproject.hasOwnProperty("actuallabor")) {
            // eslint-disable-next-line
            myproject.actuallabor.mylabor.map(mylabor => {
                if (mylabor.csiid === csiid && (mylabor.invoiceid === invoiceid)) {
                    items.push(mylabor)
                }
            })

        }
        if (myproject.hasOwnProperty("actualmaterials")) {
            // eslint-disable-next-line
            myproject.actualmaterials.mymaterial.map(mymaterial => {
                if (mymaterial.csiid === csiid && (mymaterial.invoiceid === invoiceid)) {
                    items.push(mymaterial)
                }
            })

        }
        if (myproject.hasOwnProperty("actualequipment")) {
            // eslint-disable-next-line
            myproject.actualequipment.myequipment.map(myequipment => {
                if (myequipment.csiid === csiid && (myequipment.invoiceid === invoiceid)) {
                    items.push(myequipment)
                }
            })

        }
        items.sort((a, b) => {
            return sorttimes(a.timein, b.timein)
        })
        return items;
    }
    getprofit(csiid) {
        let profit = 0;
        let directcost = 0;
        let items = this.invoiceitemsbycsiid(csiid);
        // eslint-disable-next-line
        items.map(item => {
            if (item.hasOwnProperty("laborid")) {
                directcost += DirectCostForLabor(item);
                profit += ProfitForLabor(item);
            }
            if (item.hasOwnProperty("materialid")) {
                directcost += DirectCostForMaterial(item);
                profit += ProfitForMaterial(item);
            }
            if (item.hasOwnProperty("equipmentid")) {
                directcost += DirectCostForEquipment(item);
                profit += ProfitForEquipment(item);
            }

        })

        return (((profit / directcost)) * 100)

    }
    getdirectcost(csiid) {
        const pm = new PM()
        let myproject = pm.getproject.call(this)
        let invoiceid = this.props.match.params.invoiceid;
        let directcost = 0;
        if (myproject) {
            if (myproject.hasOwnProperty("actuallabor")) {
                // eslint-disable-next-line
                myproject.actuallabor.mylabor.map(mylabor => {

                    if (mylabor.csiid === csiid && (mylabor.invoiceid === invoiceid)) {

                        directcost += DirectCostForLabor(mylabor)


                    }
                })
            }

            if (myproject.hasOwnProperty("actualmaterials")) {
                // eslint-disable-next-line
                myproject.actualmaterials.mymaterial.map(mymaterial => {
                    if (mymaterial.csiid === csiid && (mymaterial.invoiceid === invoiceid)) {
                        directcost += DirectCostForMaterial(mymaterial)
                    }

                })
            }
        }

        if (myproject.hasOwnProperty("actualequipment")) {
            // eslint-disable-next-line
            myproject.actualequipment.myequipment.map(myequipment => {
                if (myequipment.csiid === csiid && (myequipment.invoiceid === invoiceid)) {
                    directcost += DirectCostForEquipment(myequipment)
                }

            })
        }

        return directcost;

    }
    getmyoverhead(csiid) {

        let directcost = this.getdirectcost(csiid);
        let profit = this.getprofit(csiid);
        let myoverhead = .03 * (directcost * 1 + (profit / 100));
        return myoverhead;
    }
    getoverhead(csiid) {

        let directcost = this.getdirectcost(csiid);
        let profit = this.getprofit(csiid)
        let myoverhead = this.getmyoverhead(csiid);

        if (!profit) {
            profit = 1
        } else {
            profit = 1 + (profit / 100)
        }
        let overhead = ((directcost * profit) + myoverhead) * .029 + .029 * (((directcost * profit) + myoverhead) * .029) + .029 * (.029 * (((directcost * profit) + myoverhead) * .029)) + .029 * (+ .029 * (.029 * (((directcost * profit) + myoverhead) * .029))) + .029 * (.029 * (+ .029 * (.029 * (((directcost * profit) + myoverhead) * .029))))
        return overhead;
    }
    getbidprice(csiid) {

        let directcost = this.getdirectcost(csiid);
        let profit = this.getprofit(csiid);
        let overhead = this.getoverhead(csiid)
        let myoverhead = this.getmyoverhead(csiid)

        if (!profit) {
            profit = 1
        } else {
            profit = 1 + (profit / 100)
        }
        let bidprice = ((directcost * profit) + myoverhead) + overhead;
        return bidprice;
    }
    getunitprice(csiid) {

        let quantity = Number(this.getquantity(csiid));
        let bidprice = Number(this.getbidprice(csiid));

        if (quantity > 0 && bidprice > 0) {
            return (bidprice / quantity)

        } else {
            return;
        }


    }
    invoicesummary() {
        const pm = new PM();
        let invoiceamount = 0
        const biditems = this.getitems();
        const styles = MyStylesheet();
        const headerFont = pm.getHeaderFont.call(this)
        const regularFont = pm.getRegularFont.call(this)
        if (biditems.length > 0) {
            // eslint-disable-next-line
            biditems.map(item => {
                invoiceamount += this.getbidprice(item.csiid)
            })
        }
        invoiceamount = invoiceamount + .3;

        const charges = pm.getchargesbyinvoiceid.call(this, this.props.match.params.invoiceid)
        let payments = 0;
        if (charges) {
            // eslint-disable-next-line
            charges.map(charge => {
                payments += charge.amount;
            })
        }
        invoiceamount = Number(invoiceamount).toFixed(2)
        payments = Number(payments).toFixed(2);
        const summary = () => {
        if (invoiceamount > payments) {
            return (
                <div style={{ ...styles.generalFlex }}>
                    <div style={{ ...styles.flex1 }}>
                        <div style={{ ...styles.generalFlex, ...styles.bottomMargin15 }}>
                            <div style={{ ...styles.flex1,...styles.generalFont, ...regularFont }}>
                                Please Pay the Amount of ${Number(this.getamount()/100).toFixed(2)}
                            </div>

                        </div>
                        <div style={{...styles.generalFlex,...styles.bottomMargin15}}>
                            <div style={{...styles.flex1,...styles.alignCenter}}>
                            {this.stripeform()}
                            </div>
                        </div>
                    </div>
                </div>

            )
        } else {
            return (<div style={{ ...styles.generalFont, ...regularFont }}>There is no Balance Due</div>)
        }

    }
        
        return(
            <div style={{ ...styles.generalFlex }}>
        <div style={{ ...styles.flex1}}>
        <div style={{ ...styles.generalFlex }}>
        <div style={{ ...styles.flex1, ...headerFont, ...styles.generalFont }}>
            <u>Invoice Summary </u>
        </div>
        </div>
        {summary()}
    </div>
    </div>)



    }
    showsummary() {
        const pm = new PM();
        const regularFont = pm.getRegularFont.call(this)
        const headerFont = pm.getHeaderFont.call(this)
        const styles = MyStylesheet();
        const biditems = this.getitems();
        let amount = 0;
        if (biditems.length > 0) {
            // eslint-disable-next-line
            biditems.map(item => {
                amount += this.getbidprice(item.csiid)
            })
        }
        if (amount > 0) {

            return (
                <div style={{ ...styles.generalFlex,...styles.bottomMargin15 }}>
                    <div style={{ ...styles.flex1 }}>

                        <div style={{ ...styles.generalFlex }}>
                            <div style={{ ...styles.flex1, ...headerFont, ...styles.generalFont }}>
                                <u>Invoice {this.props.match.params.invoiceid}</u>
                            </div>
                        </div>


                        <div style={{ ...styles.generalFlex }}>
                            <div style={{ ...styles.flex1, ...regularFont, ...styles.generalFont }}>
                                Please Pay the Amount of ${Number(amount + .3).toFixed(2)}
                            </div>
                        </div>

                    </div>
                </div>
            )
        }
    }
    getamount() {
        const pm = new PM();
        const charges = pm.getchargesbyinvoiceid.call(this, this.props.match.params.invoiceid)
        const biditems = this.getitems();
        let amount = 0;
        if (biditems.length > 0) {
            // eslint-disable-next-line
            biditems.map(item => {
                amount += this.getbidprice(item.csiid)
            })
        }

        if (charges) {
            // eslint-disable-next-line
            charges.map(charge => {
                amount = amount - Number(charge.amount)
            })
        }
        return Math.round((amount * 100) + 30)


    }
    showbiditem(item) {

        const pm = new PM();
        const styles = MyStylesheet();
        const regularFont = pm.getRegularFont.call(this);
        const csi = pm.getactualcsibyid.call(this, item.csiid);

        let bidprice = this.getbidprice(item.csiid).toFixed(2);
        let unitprice = +Number(this.getunitprice(item.csiid)).toFixed(4);
        let directcost = Number(this.getdirectcost(item.csiid)).toFixed(2);
        let providerid = this.props.match.params.providerid;

        let projectid = this.props.match.params.projectid;
        let invoiceid = this.props.match.params.invoiceid;
        let profit = () => {
            return (
                this.getprofit(item.csiid)
            )
        }
        const quantity = () => {
            return (<div style={{ ...styles.generalContainer }}>
                Quantity <br />
                {this.getquantity(csi.csiid)}

            </div>)
        }
        const unit = () => {
            return (
                <div style={{ ...styles.generalContainer }}>
                    Unit <br />
                    {this.getunit(csi.csiid)}
                </div>)
        }
        if (this.state.width > 1200) {
            return (
                <tr>
                    <td> <Link style={{ ...styles.generalLink, ...regularFont, ...styles.generalFont }} to={`/${providerid}/myprojects/${projectid}/invoices/${invoiceid}/csi/${csi.csiid}`}> Line Item <br />
                        {csi.csi}-{csi.title} </Link></td>
                    <td style={{ ...styles.alignCenter }}>
                        {quantity()}
                    </td>
                    <td style={{ ...styles.alignCenter }}>{unit()}</td>
                    <td style={{ ...styles.alignCenter }}>{directcost}</td>
                    <td style={{ ...styles.alignCenter }}>{profit()}</td>
                    <td style={{ ...styles.alignCenter }}>{bidprice}</td>
                    <td style={{ ...styles.alignCenter }}> {`$${unitprice}/${this.getunit(csi.csiid)}`}</td>
                </tr>)



        } else {
            return (
                <div style={{ ...styles.generalFlex }} key={item.lineid}>
                    <div style={{ ...styles.flex1 }}>
                        <div style={{ ...styles.generalFlex }}>
                            <div style={{ ...styles.flex2, ...regularFont, ...styles.generalFont, ...styles.showBorder }}>
                                <Link style={{ ...styles.generalLink, ...regularFont, ...styles.generalFont }} to={`/${providerid}/myprojects/${projectid}/invoices/${invoiceid}/csi/${csi.csiid}`}> Line Item <br />
                                    {csi.csi}-{csi.title} </Link>
                            </div>
                            <div style={{ ...styles.flex1, ...regularFont, ...styles.generalFont, ...styles.showBorder, ...styles.alignCenter }}>
                                Quantity <br />
                                {this.getquantity(csi.csiid)}

                            </div>
                            <div style={{ ...styles.flex1, ...regularFont, ...styles.generalFont, ...styles.showBorder, ...styles.alignCenter }}>
                                Unit <br />
                                {this.getunit(csi.csiid)}

                            </div>
                        </div>

                        <div style={{ ...styles.generalFlex }}>
                            <div style={{ ...styles.flex1, ...regularFont, ...styles.generalFont, ...styles.showBorder, ...styles.alignCenter }}>
                                Direct Cost <br />
                                ${directcost}
                            </div>
                            <div style={{ ...styles.flex1, ...regularFont, ...styles.generalFont, ...styles.showBorder, ...styles.alignCenter }}>
                                Profit % <br />
                                {profit()}
                            </div>
                            <div style={{ ...styles.flex1, ...regularFont, ...styles.generalFont, ...styles.showBorder, ...styles.alignCenter }}>
                                Bid Price <br />
                                ${bidprice}
                            </div>
                            <div style={{ ...styles.flex1, ...regularFont, ...styles.generalFont, ...styles.showBorder, ...styles.alignCenter }}>
                                Unit Price
                                {`$${unitprice}/${this.getunit(csi.csiid)}`}
                            </div>
                        </div>
                    </div>
                </div>)
        }
    }

    getapproved() {
        const pm = new PM();

        const invoice = pm.getinvoicebyid.call(this, this.props.match.params.invoiceid)
        let approved = "";
        if (invoice) {

            if (invoice.approved) {

                approved = `Stripe Payment Captured On: ${UTCStringFormatDateforProposal(invoice.approved)}`;
            }
        }
        return approved;

    }

    async processStripe(token, amount) {
        const pm = new PM();
        const providerid = this.props.match.params.providerid;
        const invoiceid = this.props.match.params.invoiceid;
        const myuser = pm.getuser.call(this);
        if (myuser) {
            try {

                let response = await payInvoice(providerid, invoiceid, token, amount)
                console.log(response)
                if(response.hasOwnProperty("invoice")) {
                    const invoice = response.invoice;
                    const invoiceid = invoice.invoiceid;
                    const myinvoice = pm.getinvoicebyid.call(this,invoiceid)
                    const myproject = pm.getprojectbyid.call(this,this.props.match.params.projectid)
                    if(myproject) {
                        const i = pm.getprojectkeybyid.call(this,this.props.match.params.projectid)
                    if(myinvoice) {
                
                    const j = pm.getinvoicekeybyid.call(this,invoiceid)
                    myuser.projects.myproject[i].invoices.myinvoice[j] = response.invoice;
                    this.props.reduxUser(myuser)
                    this.setState({render:'render'})

                    }

                }
                }
              

            } catch (err) {
                alert(err)
            }

        }

    }



    stripeform() {
        const invoiceid = this.props.match.params.invoiceid;
        const amount = this.getamount();
        if (amount > 0) {

            return (
                <StripeCheckout
                    name="CivilEngineer.io"
                    description={`Payment for Invoice ID ${invoiceid}`}
                    amount={amount}
                    token={token => this.processStripe(token, amount)}
                    stripeKey={process.env.REACT_APP_STRIPE_PUBLIC}
                />
            )

        }

    }
    getinvoice() {
        let invoiceid = this.props.match.params.invoiceid;
        let invoice = false;
        const pm = new PM();
        let myproject = pm.getproject.call(this);
        if (myproject.hasOwnProperty("invoices")) {
            // eslint-disable-next-line
            myproject.invoices.myinvoice.map(myinvoice => {
                if (myinvoice.invoiceid === invoiceid) {
                    invoice = myinvoice;
                }
            })
        }
        return invoice;
    }
    getactualitems() {

        let actualitems = false;
        let myinvoice = this.getinvoice();
        if (myinvoice) {
            if (myinvoice.hasOwnProperty("bid")) {
                actualitems = myinvoice.bid.biditem
            }
        }
        return actualitems;
    }
    getactualitem(csiid) {

        let actualitems = this.getactualitems();

        let actualitem = false;
        if (actualitems) {
            // eslint-disable-next-line
            actualitems.map(item => {
                if (item.csiid === csiid) {
                    actualitem = item;
                }
            })
        }
        return actualitem;
    }
    getquantity(csiid) {

        let actualitem = this.getactualitem(csiid);

        if (actualitem) {
            return Number(actualitem.quantity);
        } else {
            return;
        }

    }
    getitems() {
        const pm = new PM();
        let invoiceid = this.props.match.params.invoiceid;
        let payitems = pm.getAllActual.call(this)

        let items = [];
        const validateNewItem = (items, item) => {
            let validate = true;
            // eslint-disable-next-line
            items.map(myitem => {
                if (myitem.csiid === item.csiid) {
                    validate = false;
                }
            })
            return validate;
        }
        // eslint-disable-next-line
        payitems.map(item => {

            if (item.hasOwnProperty("laborid")) {
                if (item.invoiceid === invoiceid) {
                    items.push(item)
                }

            }
            if (item.hasOwnProperty("materialid")) {
                if (item.invoiceid === invoiceid) {
                    items.push(item)
                }

            }
            if (item.hasOwnProperty("equipmentid")) {
                if (item.invoiceid === invoiceid) {
                    items.push(item)
                }

            }

        })
        let csis = [];
        if (items.length > 0) {
            // eslint-disable-next-line
            items.map(lineitem => {
                if (validateNewItem(csis, lineitem)) {

                    let newItem = CreateBidScheduleItem(lineitem.csiid, "", 0)
                    csis.push(newItem)
                }
            })
        }

        return csis;
    }
    getunit(csiid) {

        let scheduleitem = this.getactualitem(csiid);

        if (scheduleitem) {

            return scheduleitem.unit;


        } else {
            return ""
        }

    }
    showbiditems() {

        let biditems = this.getitems();

        let lineids = [];
        if (biditems.length > 0) {
            // eslint-disable-next-line
            biditems.map(item => {
                lineids.push(this.showbiditem(item))
            })
        }

        return lineids;
    }
    showcharge(charge) {
        const pm = new PM();
        const styles = MyStylesheet();
        const created = inputUTCStringForLaborID(charge.created);
        const regularFont = pm.getRegularFont.call(this)
        return (<div style={{ ...regularFont, ...styles.generalFont }} key={charge.chargeid}>
            Charge Captured on {created} for the Amount ${charge.amount} </div>)

    }
    showcharges() {
        const pm = new PM();
        const invoiceid = this.props.match.params.invoiceid;
        const charges = pm.getchargesbyinvoiceid.call(this, invoiceid)
        const styles = MyStylesheet();
        const headerFont = pm.getHeaderFont.call(this)
        let chargeids = [];
        const jsx = (chargeids) => {
            return (
                <div style={{ ...styles.generalFlex }}>
                    <div style={{ ...styles.flex1 }}>

                        <div style={{ ...styles.generalFlex }}>
                            <div style={{ ...styles.flex1, ...headerFont, ...styles.generalFont }}>
                                <u>Summary of Payments</u>
                            </div>
                        </div>

                        {chargeids}

                    </div>
                </div>
            )


        }
        if (charges) {
            // eslint-disable-next-line
            charges.map(charge => {
                chargeids.push(this.showcharge(charge))
            })

            return jsx(chargeids)

        } else {
            return;
        }

    }

    render() {
        const styles = MyStylesheet();
        const projectid = this.props.match.params.projectid;
        const pm = new PM();
        const headerFont = pm.getHeaderFont.call(this)
        const invoiceid = this.props.match.params.invoiceid;
        const regularFont = pm.getRegularFont.call(this)
        return (
            <div style={{ ...styles.generalFlex }}>
                <div style={{ ...styles.flex1 }}>

                    <div style={{ ...styles.generalFlex }}>
                        <div style={{ ...styles.flex1, ...styles.alignCenter, ...headerFont, ...styles.generalFont }}>
                            /{projectid} <br />
                            View Invoice {invoiceid}
                        </div>
                    </div>
                    {pm.showbidtable.call(this)}

                    <div style={{ ...styles.generalFlex, ...styles.topMargin15, ...styles.bottomMargin15 }}>
                        <div style={{ ...styles.flex1, ...styles.alignCenter, ...regularFont, ...styles.generalFont }}>
                            {this.getapproved()}
                        </div>
                    </div>

                    {this.showsummary()}

                    {this.showcharges()}

                    {this.invoicesummary()}

                    {pm.showprojectid.call(this)}


                </div>
            </div>)



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
export default connect(mapStateToProps, actions)(ViewInvoice)


