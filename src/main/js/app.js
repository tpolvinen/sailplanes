'use strict';
// tag::vars[]
const React = require('react');
const ReactDOM = require('react-dom')
const when = require('when');
const client = require('./client');
const follow = require('./follow'); // function to hop multiple links by "rel"
const stompClient = require('./websocket-listener');
const root = '/api';
// end::vars[]

// tag::app[]
class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {sailplanes: [], attributes: [], page: 1, pageSize: 2, links: {}};
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
		this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
	}

	loadFromServer(pageSize) {
		follow(client, root, [
			{rel: 'sailplanes', params: {size: pageSize}}]
		).then(sailplaneCollection => {
			return client({
				method: 'GET',
				path: sailplaneCollection.entity._links.profile.href,
				headers: {'Accept': 'application/schema+json'}
			}).then(schema => {
				/**
				 * Filter unneeded JSON Schema properties, like uri references and
				 * subtypes ($ref).
				 */
				Object.keys(schema.entity.properties).forEach(function (property) {
					if (schema.entity.properties[property].hasOwnProperty('format') &&
						schema.entity.properties[property].format === 'uri') {
						delete schema.entity.properties[property];
					}
					else if (schema.entity.properties[property].hasOwnProperty('$ref')) {
						delete schema.entity.properties[property];
					}
				});

				this.schema = schema.entity;
				this.links = sailplaneCollection.entity._links;
				return sailplaneCollection;
			});
		}).then(sailplaneCollection => {
			this.page = sailplaneCollection.entity.page;
			return sailplaneCollection.entity._embedded.sailplanes.map(sailplane =>
					client({
						method: 'GET',
						path: sailplane._links.self.href
					})
			);
		}).then(sailplanePromises => {
			return when.all(sailplanePromises);
		}).done(sailplanes => {
			this.setState({
				page: this.page,
				sailplanes: sailplanes,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links
			});
		});
	}

	onCreate(newSailplane) {
		follow(client, root, ['sailplanes']).done(response => {
			client({
				method: 'POST',
				path: response.entity._links.self.href,
				entity: newSailplane,
				headers: {'Content-Type': 'application/json'}
			})
		})
	}

	onUpdate(sailplane, updatedSailplane) {
		client({
			method: 'PUT',
			path: sailplane.entity._links.self.href,
			entity: updatedSailplane,
			headers: {
				'Content-Type': 'application/json',
				'If-Match': sailplane.headers.Etag
			}
		}).done(response => {
			/* Let the websocket handler update the state */
		}, response => {
			if (response.status.code === 403) {
				alert('ACCESS DENIED: You are not authorized to update ' +
					sailplane.entity._links.self.href);
			}
			if (response.status.code === 412) {
				alert('DENIED: Unable to update ' +
					sailplane.entity._links.self.href + '. Your copy is stale.');
			}
		});
	}

	onDelete(sailplane) {
		client({
			method: 'DELETE', 
			path: sailplane.entity._links.self.href
		}).done(response => {
			/* let the websocket handle updating the UI */
		},
		response => {
			if (response.status.code === 403) {
				alert('ACCESS DENIED: You are not authorized to delete ' +
					sailplane.entity._links.self.href);
			}
		}); 
	}

	onNavigate(navUri) {
		client({
			method: 'GET',
			path: navUri
		}).then(sailplaneCollection => {
			this.links = sailplaneCollection.entity._links;
			this.page = sailplaneCollection.entity.page;

			return sailplaneCollection.entity._embedded.sailplanes.map(sailplane =>
					client({
						method: 'GET',
						path: sailplane._links.self.href
					})
			);
		}).then(sailplanePromises => {
			return when.all(sailplanePromises);
		}).done(sailplanes => {
			this.setState({
				page: this.page,
				sailplanes: sailplanes,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}

	updatePageSize(pageSize) {
		if (pageSize !== this.state.pageSize) {
			this.loadFromServer(pageSize);
		}
	}

	// tag::websocket-handlers[]
	refreshAndGoToLastPage(message) {
		follow(client, root, [{
			rel: 'sailplanes',
			params: {size: this.state.pageSize}
		}]).done(response => {
			if (response.entity._links.last !== undefined) {
				this.onNavigate(response.entity._links.last.href);
			} else {
				this.onNavigate(response.entity._links.self.href);
			}
		})
	}

	refreshCurrentPage(message) {
		follow(client, root, [{
			rel: 'sailplanes',
			params: {
				size: this.state.pageSize,
				page: this.state.page.number
			}
		}]).then(sailplaneCollection => {
			this.links = sailplaneCollection.entity._links;
			this.page = sailplaneCollection.entity.page;

			return sailplaneCollection.entity._embedded.sailplanes.map(sailplane => {
				return client({
					method: 'GET',
					path: sailplane._links.self.href
				})
			});
		}).then(sailplanePromises => {
			return when.all(sailplanePromises);
		}).then(sailplanes => {
			this.setState({
				page: this.page,
				sailplanes: sailplanes,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
	}

	componentDidMount() {
		this.loadFromServer(this.state.pageSize);
		stompClient.register([
			{route: '/topic/newSailplane', callback: this.refreshAndGoToLastPage},
			{route: '/topic/updateSailplane', callback: this.refreshCurrentPage},
			{route: '/topic/deleteSailplane', callback: this.refreshCurrentPage}
		]);
	}

	render() {
		return (
			<div>
				<CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
				<SailplaneList page={this.state.page}
							sailplanes={this.state.sailplanes}
							links={this.state.links}
							pageSize={this.state.pageSize}
							attributes={this.state.attributes}
							onNavigate={this.onNavigate}
							onUpdate={this.onUpdate}
							onDelete={this.onDelete}
							updatePageSize={this.updatePageSize}/>
			</div>
		)
	}
}

class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		var newSailplane = {};
		this.props.attributes.forEach(attribute => {
			newSailplane[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onCreate(newSailplane);

		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).value = ''; // clear out the dialog's inputs
		});

		window.location = "#"; // Navigate away from the dialog to hide it.
	}

	render() {
		var inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute} ref={attribute} className="field" />
			</p>
		);

		return (
			<div>
				<a href="#createSailplane">Create</a>

				<div id="createSailplane" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X)</a>

						<h2>Create new sailplane</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

}

class UpdateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		var updatedSailplane = {};
		this.props.attributes.forEach(attribute => {
			updatedSailplane[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onUpdate(this.props.sailplane, updatedSailplane);
		window.location = "#";
	}

	render() {
		var inputs = this.props.attributes.map(attribute =>
				<p key={this.props.sailplane.entity[attribute]}>
					<input type="text" placeholder={attribute}
						   defaultValue={this.props.sailplane.entity[attribute]}
						   ref={attribute} className="field" />
				</p>
		);

		var dialogId = "updateSailplane-" + this.props.sailplane.entity._links.self.href;

		return (
			<div>
				<a href={"#" + dialogId}>Update</a>
				<div id={dialogId} className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">XD</a>

						<h2>Update a sailplane!</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Update</button>
						</form>
					</div>
				</div>
			</div>
		)
	}

};

class SailplaneList extends React.Component{

	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
	}

	handleInput(e) {
		e.preventDefault();
		var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(pageSize);
		} else {
			ReactDOM.findDOMNode(this.refs.pageSize).value =
				pageSize.substring(0, pageSize.length - 1);
		}
	}

	handleNavFirst(e){
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}

	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}

	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}

	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}

	render() {
		var pageInfo = this.props.page.hasOwnProperty("number") ?
			<h3>Sailplanes - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;

		var sailplanes = this.props.sailplanes.map(sailplane =>
			<Sailplane key={sailplane.entity._links.self.href} 
						sailplane={sailplane}
						attributes={this.props.attributes}
						onUpdate={this.props.onUpdate}
						onDelete={this.props.onDelete}/>
		);

		var navLinks = [];
		if ("first" in this.props.links) {
			navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
		}
		if ("prev" in this.props.links) {
			navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
		}
		if ("next" in this.props.links) {
			navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
		}
		if ("last" in this.props.links) {
			navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
		}

		return (
			<div>
				{pageInfo}
				<input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
				<table>
					<tbody>
						<tr>
							<th>Name</th>
							<th>Year</th>
							<th>Structure</th>
							<th>In Flight</th>
							<th>Wing Area</th>
							<th>Wing Loading</th>
							<th>Aspect Ratio</th>
							<th>Manager</th>
							<th></th>
							<th></th>
						</tr>
						{sailplanes}
					</tbody>
				</table>
				<div>
					{navLinks}
				</div>
			</div>
		)
	}
}

// tag::sailplane[]
class Sailplane extends React.Component{

	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}

	handleDelete() {
		this.props.onDelete(this.props.sailplane);
	}

	render() {
		return (
			<tr>
				<td>{this.props.sailplane.entity.name}</td>
				<td>{this.props.sailplane.entity.year}</td>
				<td>{this.props.sailplane.entity.structure}</td>
				<td>{this.props.sailplane.entity.inFlight}</td>
				<td>{this.props.sailplane.entity.wingArea}</td>
				<td>{this.props.sailplane.entity.wingLoading}</td>
				<td>{this.props.sailplane.entity.aspectRatio}</td>
				<td>{this.props.sailplane.entity.manager.name}</td>
				<td>
					<UpdateDialog sailplane={this.props.sailplane}
								  attributes={this.props.attributes}
								  onUpdate={this.props.onUpdate}/>
				</td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}
}
// end::sailplane[]

// tag::render[]
ReactDOM.render(
	<App />,
	document.getElementById('react')
)
// end::render[]