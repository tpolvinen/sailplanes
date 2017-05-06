'use strict';

// tag::vars[]
const React = require('react');
const ReactDOM = require('react-dom')
const client = require('./client');
// end::vars[]

// tag::app[]
class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {sailplanes: []};
	}

	componentDidMount() {
		client({method: 'GET', path: '/api/sailplanes'}).done(response => {
			this.setState({sailplanes: response.entity._embedded.sailplanes});
		});
	}

	render() {
		return (
			<SailplaneList sailplanes={this.state.sailplanes}/>
		)
	}
}
// end::app[]

// tag::sailplane-list[]
class SailplaneList extends React.Component{
	render() {
		var sailplanes = this.props.sailplanes.map(sailplane =>
			<Sailplane key={sailplane._links.self.href} sailplane={sailplane}/>
		);
		return (
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
					</tr>
					{sailplanes}
				</tbody>
			</table>
		)
	}
}
// end::sailplane-list[]

// tag::sailplane[]
class Sailplane extends React.Component{
	render() {
		return (
			<tr>
				<td>{this.props.sailplane.name}</td>
				<td>{this.props.sailplane.year}</td>
				<td>{this.props.sailplane.structure}</td>
				<td>{this.props.sailplane.inFlight}</td>
				<td>{this.props.sailplane.wingArea}</td>
				<td>{this.props.sailplane.wingLoading}</td>
				<td>{this.props.sailplane.aspectRatio}</td>
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

