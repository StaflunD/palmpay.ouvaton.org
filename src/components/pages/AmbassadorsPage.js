import React, { Component } from 'react';
import { FormattedMessage, FormattedHTMLMessage } from 'react-intl';
import Modal from 'react-modal';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';

// Custom components
import AppHeader from '../AppHeader';
import Footer from '../Footer';
import EnhancedTable from '../EnhancedTable';
import LayerMap from '../LayerMap';
import PreviewMap from '../PreviewMap';

// Helpers
import Client from '../../utils/feathers';
import { stripProtocol } from '../../utils/url';
import Countries from 'country-list';

// Images
import AmbassadorPin from '../../assets/img/map/ambassador_pin.png';
import LoadingGif from '../../assets/img/loading_icon.gif';

// List of countries
const countries = Countries();

const centerStyle = {
  textAlign: 'center',
  marginTop: 20,
  marginBottom: 20
};

const loadingStyle = {
  textAlign: 'center',
  marginTop: 20,
  marginBottom: 20,
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto'
};

const mapsStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)',
    minWidth              : '300px'
  }
};

const columnData = [
  { id: 'nickname', numeric: false, disablePadding: true, label: 'Nickname' },
  { id: 'telegram', numeric: false, disablePadding: false, label: 'Telegram Account' },
  { id: 'keybase', numeric: false, disablePadding: false, label: 'Keybase' },
  { id: 'email', numeric: false, disablePadding: false, label: 'Email' },
  { id: 'phone', numeric: false, disablePadding: false, label: 'Phone' },
  { id: 'link', numeric: false, disablePadding: false, label: 'URL' },
  { id: 'location', numeric: false, disablePadding: true, label: 'Location' },
  { id: 'map', numeric: false, disablePadding: false, label: 'Maps', disableSearch: true}
];

/**
 * Ambassador page component.
 */
class AmbassadorsPage extends Component {
  constructor(props, context) {
    super(props, context);

    /** @type {ComponentState} */
    this.state = {
      ambassadors: {
        total: 0,
        limit: 0,
        skip: 0,
        data: []
      },
      loading: true,
      rowsPerPage: [100,200,300],
      numberOfRows: 100,
      page: 1,
      total: undefined,
      mapsModalIsOpen: false,
      mapsTitle: '',
      mapsDescription: '',
      mapsLat: 0,
      mapsLon: 0,
    };
  }

  /**
   * @description Lifecycle event handler called just after the App loads into the DOM.
   */
  UNSAFE_componentWillMount() {
    // Get the ambassadors list
    this.getAmbassadors();
  }

  fillResults(result) {
    const data = result;
    return (item) => data.data.push(item);
  }

  /**
   * @description Get ambassadors from the web service
   * @param {number} [limit=10] - Max items to be returned.
   * @param {number} [skip=0] - Start index search
   */
  getAmbassadors = async (limit = 50, skip = 0) => {
    const app = this;
    // Initially we don't know how much the total value is, so to make sure we enter the loop
    // at least once we're just setting it to be 1
    let total = 1;

    const ambassadors = Client.service('api/v2/ambassadors');
    this.setState({loading: true});
    let result;
    while(skip < total){
      let partialResponse = await ambassadors.find({
        query: {
          $sort: { account: 1 },
          $limit: limit,
          $skip: skip
        }
      });
      total = partialResponse.total;
      result === undefined ? result = partialResponse : partialResponse.data.map(this.fillResults(result));
      skip = skip + limit;
    }

    // Once both return, update the state
    app.setState({loading: false, ambassadors: result});
  };

  /**
   * @description Close Maps modal.
   */
  closeMapsModal() {
     this.setState({
       mapsLat: 0,
       mapsLon: 0,
       mapsModalIsOpen: false
     });
  }

  openMaps(name, address, lat, lon){
    this.setState({
      mapsTitle: name,
      mapsDescription: address,
      mapsLat: lat,
      mapsLon: lon,
      mapsModalIsOpen: true
    });
  }

  addLocationSearchText(cities){
    let searchText = '';
    cities.forEach((location) => {
      searchText += `${(location.name).replace(/(^|\s)\S/g, l => l.toUpperCase())} - ${countries.getName(location.country)} `;
    });

    return searchText;
  }

  addLocation(cities){
    return (
      <div>
        <br /><br />
        {cities.map((location, index) => (
          <div key={index}>
            {`${(location.name).replace(/(^|\s)\S/g, l => l.toUpperCase())} - ${countries.getName(location.country)}`}
            <br /><br /><br />
          </div>
        ))}
      </div>
    );
  }

  addMapButton(nickname, cities){
    const app = this;
    return (
      <div>
        <br />
        {cities.map((location, index) => (
          <div key={index}>
            <Button
              className="App-button"
              variant="contained"
              style={{
                  backgroundColor: "#2069b3",
                  color: 'white'
              }}
              onClick={() => app.openMaps(
                nickname,
                `${(location.name).replace(/(^|\s)\S/g, l => l.toUpperCase())} - ${countries.getName(location.country)}`,
                location.lat,
                location.lon
              )}
            >Show on Map
            </Button>
            <br /><br />
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { data } = this.state.ambassadors;

    const app = this;

    // Add location and maps button
    data.forEach(function(ambassador){
      ambassador.location = {
        searchText: app.addLocationSearchText(ambassador.cities),
        value: app.addLocation(ambassador.cities)
      }
      ambassador.map = app.addMapButton(ambassador.nickname, ambassador.cities);
      ambassador.link = <a target="_blank" rel="noopener noreferrer"
        href={ambassador.url}>{stripProtocol(ambassador.url)}</a>;
    });

    return (
      <div>
        <AppHeader />

        <div id="maincontent">
      <section data-spy="scroll" data-target="#mainNav" id="services">
      <div className="containerfix">
      <div className="row">
      <div className="col-md-10 mx-md-auto">


        <h2 className="ambassadorsTitle" style={centerStyle}><FormattedMessage id="ambassadors.title" /></h2>
        { /* Conditional Rendering */}
            {(this.state.loading) ? (
              <img src={LoadingGif} alt="Loading" style={loadingStyle} />
        ): (
          <div>
            <p style={{ textAlign: 'left', marginLeft: 20, marginRight: 20 }}>
              <FormattedHTMLMessage id="ambassadors.description1" />
              <Link to="/merchants">
                <FormattedMessage id="ambassadors.merchants_link_description" />
              </Link>
              <FormattedHTMLMessage id="ambassadors.description2" />
            </p>

            <Modal
              isOpen={this.state.mapsModalIsOpen}
              onRequestClose={() => this.closeMapsModal()}
              style={mapsStyles}
              ariaHideApp={false}
              contentLabel={this.state.mapsTitle}
            >
              <PreviewMap
                icon={AmbassadorPin}
                infoTitle={this.state.mapsTitle}
                infoDescription={this.state.mapsDescription}
                lat={this.state.mapsLat}
                lng={this.state.mapsLon}
                width="800px"
                height="600px"
              />
            </Modal>
            {(data.length > 0) ? (
              <div>
                <br />
                <EnhancedTable
                  columnData={columnData}
                  data={data}
                  orderBy="nickname"
                  showSearchColumns={false}
                  rowsPerPage={10}
                  isAdmin={false}
                />
              </div>
            ) : (
              <div style={centerStyle}>No Data found</div>
            )}
            <div className="map">
              <LayerMap
                ambassadorsLayer={true}
                merchantsLayer={false}
                mapHeight={'600px'}
                ambsMap={true}
                showControls={this.state.mapsModalIsOpen}
              />
            </div>
          </div>
        )}
</div>
  </div>
</div>
</section>
  </div>

        <Footer />
      </div>
    );
  }
}

export { AmbassadorsPage };
