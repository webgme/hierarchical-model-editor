/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 * React wrapper around cytoscape. If scalability ever becomes and issue - consider implementing a fine-grained
 * element update.
 * @author pmeijer / https://github.com/pmeijer
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';

import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import dagre from 'cytoscape-dagre';


cytoscape.use(coseBilkent);

// cytoscape.use(cycola);
cytoscape.use(dagre);

export default class ReactCytoscape extends Component {
    static propTypes = {
        cyRef: PropTypes.func.isRequired,
        elements: PropTypes.object.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        containerID: PropTypes.string,
        layout: PropTypes.object,
        style: PropTypes.arrayOf(PropTypes.object),
        cytoscapeOptions: PropTypes.object,
    };

    static defaultProps = {
        containerID: 'cy',
        layout: {name: 'cola'},
        cytoscapeOptions: {},
        style: [
            {
                selector: 'node',
                css: {
                    content: function elemRender(ele) {
                        return ele.data('label') || ele.data('id');
                    },
                    'text-valign': 'center',
                    'text-halign': 'center',
                },
            },
            {
                selector: '$node > node',
                css: {
                    'padding-top': '10px',
                    'padding-left': '10px',
                    'padding-bottom': '10px',
                    'padding-right': '10px',
                    'text-valign': 'top',
                    'text-halign': 'center',
                    'background-color': '#bbb',
                },
            },
            {
                selector: 'edge',
                css: {
                    'target-arrow-shape': 'triangle',
                },
            },
            {
                selector: ':selected',
                css: {
                    'background-color': 'black',
                    'line-color': 'black',
                    'target-arrow-color': 'black',
                    'source-arrow-color': 'black',
                },
            },
        ],
    };

    componentDidMount() {
        const opts = Object.assign({
            container: this.container,

            boxSelectionEnabled: false,
            autounselectify: true,

            style: this.props.style,
            layout: this.props.layout,
        }, this.props.cytoscapeOptions);

        this.cy = cytoscape(opts);
        // this.cy.layout({name: 'cose-bilkent', coseBilkentOptions});
        this.cy.json({elements: this.props.elements});

        if (this.props.cyRef) {
            this.props.cyRef(this.cy, this.container);
        }

        return this.cy;
    }

    componentWillReceiveProps(nextProps) {
        const {
            elements,
            width,
            height,
            style,
        } = this.props;

        // TODO: Consider making more fine-grained updates here instead.
        if (JSON.stringify(elements) !== JSON.stringify(nextProps.elements)) {
            this.cy.json({elements: nextProps.elements});
        }

        if (width !== nextProps.width || height !== nextProps.height) {
            this.cy.resize();
        }

        if (JSON.stringify(style) !== JSON.stringify(nextProps.style)) {
            this.cy.style(nextProps.style);
        }

        if (elements.nodes && elements.nodes.length === 0 &&
            nextProps.elements.nodes.length > 0) {
            // Initial elements received -> fit graph to canvas.
            this.cy.fit();
        }
    }

    componentWillUnmount() {
        if (this.cy) {
            this.cy.destroy();
        }
    }

    render() {
        const styleContainer = Object.assign({
            height: '100%',
            width: '100%',
            display: 'block',
        }, ...this.props.style);
        return (
            <div
                className="graph"
                id={this.props.containerID}
                ref={(elt) => {
                    this.container = elt;
                }}
                style={styleContainer}
            />);
    }
}
