/** ------------------------Begin data components------------------------- **/

const spotifySearch = {
    endpoint: 'https://api.spotify.com/v1/search',

    /**
     * Makes a call to the Spotify API and executes the callback
     * with whether or not the request was successful and with the response
     */
    searchArtist(searchQuery, callback) {
        $.ajax({
            url: this.endpoint,
            type:'GET',
            dataType:'json',
            data:{type: 'artist', q: searchQuery},
            success: function(response) {
                callback(true, response);
            }.bind(this),
            error:function(response){
                callback(false, response);
            }.bind(this)
        });
    }
};

const artistHandler = {

    /**
     * Format data to give to React components and sort by name
     */
    getDisplayData(response) {
        const displayData = [];

        for(let i = 0; i < response.artists.items.length; i++) {
            const artist = response.artists.items[i];

            displayData.push({
                id: artist.id,
                name: artist.name,
                url: artist.external_urls.spotify,
                image: this.getClosestImage(artist.images)
            });
        }
        
        this.sortAlpha(displayData);
        
        return displayData;
    },

    /**
     * get image that has one  of its dimensions (h or w) closest to the target
     * without going under
     */
    getClosestImage(images, targetSide = 200) {
        if(images.length === 0) {
            return {
                height: targetSide,
                width: targetSide,
                url: 'default-image.png'
            };
        }

        let bestImage;
        let bestDiff;
        for(let i = 0; i < images.length; i++) {
            const image = images[i];

            const sideCheck = image.width >= image.height ? image.width : image.height;
            const sideDiff = sideCheck - targetSide;

            if(bestDiff === undefined || (sideDiff < bestDiff && sideDiff >= 0)) {
                bestImage = image;
                bestDiff = sideDiff; //images are returned sorted by widest
            }
        }

        return bestImage;
    },

    /**
     * Sort a list of objects by its 'name' property
     */
    sortAlpha(items) {
        items.sort(function(a, b) {
            const nameA = a.name.toUpperCase();
            const nameB = b.name.toUpperCase();

            if(nameA < nameB) {
                return -1;
            }

            if(nameB < nameA) {
                return 1;
            }

            return 0;
        });
    }
};

/** ------------------Begin React components-------------------- **/

const Artist = React.createClass({
    render: function() {
      // This takes any props passed to CheckLink and copies them to <a>
        return (
            <div className="artist row">
                <div className="col-md-3">
                    <div className="img-thumbnail img-wrap">
                        <img className="artist-img center-block" src={this.props.image.url} />
                    </div>
                </div>
                <div className="col-md-9 well artist-data">
                    <h3>{this.props.name}</h3>
                    <a target="_blank" href={this.props.url}>{this.props.url}</a>
                </div>
            </div>

        );
    }
});

const ArtistList = React.createClass({
    render: function() {
        let artistNodes;

        if(this.props.data.length > 0) {
            artistNodes = this.props.data.map(function(artist) {
                return (
                    <Artist
                        name={artist.name}
                        image={artist.image}
                        url={artist.url}
                        key={artist.id}
                    />
                );
            });
        } else {
            artistNodes = <p className="text-warning">No results...</p>;
        }

        return (
            <div className="artistList">
                <h2>Search Results</h2>
                {artistNodes}
            </div>
        );
    }
});

const ErrorMessage = React.createClass({
    render: function() {
        let errorNode;

        if(this.props.message.length > 0) {
            errorNode = <p className="text-danger">{this.props.message}</p>;
        } else {
            errorNode = '';
        }

        return (
            <div className="error-message">
                {errorNode}
            </div>
        );
    }
});

const ArtistForm = React.createClass({
    getInitialState: function() {
          return {query: ''};
    },
    handleQueryChange: function(e) {
        this.setState({query: e.target.value});
    },
    handleSubmit: function(e) {
        e.preventDefault();

        const searchQuery = this.state.query.trim();

        if(!searchQuery) {
            this.setState({query: ''});
        }

        this.props.onSearchSubmit(searchQuery);
    },
    render: function() {
        return (
            <form className="searchForm" onSubmit={this.handleSubmit}>
                <span className="lead">Search Artists: </span>
                <input
                  type="text"
                  placeholder="Search Artists"
                  value={this.state.query}
                  onChange={this.handleQueryChange}
                />
                <input type="submit" value="Search" />
            </form>
        );
    }
});

const ArtistContainer = React.createClass({
    getInitialState: function() {
        return {artists: [], error: ''};
    },
    handleSearchSubmit(query) {
        spotifySearch.searchArtist(query, function(success, response) {

            if(success) {
                this.setState({
                    artists: artistHandler.getDisplayData(response),
                    error: ''
                });
            } else {
                this.setState({
                    artists: [],
                    error: `There was a problem with your search: ${response.error.message}`
                });
            }

            
        }.bind(this));
    },
    render: function() {
        return (
            <div className="artistContainer container">
              <h1>Spotify Artist Search</h1>
              <ArtistForm onSearchSubmit={this.handleSearchSubmit} />
              <ArtistList data={this.state.artists} />
              <ErrorMessage message={this.state.error} />
            </div>
        );
    }
});

ReactDOM.render(
    <ArtistContainer />,
    document.getElementById('container')
);
