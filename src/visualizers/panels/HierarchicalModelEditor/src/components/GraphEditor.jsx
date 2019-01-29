/**
 * DISTRIBUTION STATEMENT C: U.S. Government agencies and their contractors.
 * Other requests shall be referred to DARPA’s Public Release Center via email at prc@darpa.mil.
 *
 * This component receives the data from the gme nodes and builds up the input data for cytoscape.
 * It is relatively domain-agnostic, mainly the styles are tied with DCRYPPS (apart from what is passed in via the
 * options such as filters).
 * @author pmeijer / https://github.com/pmeijer
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';

import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';

import LockIcon from '@material-ui/icons/Lock';
import TransformIcon from '@material-ui/icons/Transform';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import FilterIcon from '@material-ui/icons/FilterList';

import ReactCytoscape from './ReactCytoscape';
import ContextMenu from './ContextMenu';
import FilterSelector from './FilterSelector';

import CONSTANTS from '../../../../../common/CONSTANTS';

const ATTACK_MODEL_NODES = ['goal', 'or', 'plan', 'action'];

const DEFAULT_STYLES = [
    {
        selector: 'node[hasChildren]',
        style: {
            content: 'data(label)',
            // http://js.cytoscape.org/#style/background-image
            'background-width': '20%',
            'background-height': '20%',
        },
    },
    {
        selector: 'node[^hasChildren]',
        style: {
            content: 'data(label)',
            // http://js.cytoscape.org/#style/background-image
            'background-width': '80%',
            'background-height': '80%',
        },
    },
    {
        selector: 'edge.pointer',
        style: {
            content: 'data(label)',
            'line-color': 'rgb(0,0,255)',
            'target-arrow-color': 'rgb(0,0,255)',
            'target-arrow-shape': 'open',
        },
    },
    {
        selector: 'edge.set-member',
        style: {
            content: 'data(label)',
            'line-color': 'rgb(255,0,255)',
        },
    },
    {
        selector: 'edge.base-pointer',
        style: {
            width: 1,
            'line-color': 'rgb(255,0,0)',
            'target-arrow-fill': 'hollow',
            'target-arrow-color': 'rgb(255,0,0)',
            'target-arrow-shape': 'triangle',
        },
    },
    {
        selector: 'node[hasChildren].in-active-selection',
        style: {
            // 'border-width': '2px',
            'border-style': 'solid',
            'border-opacity': '1',
            'border-color': 'rgba(82, 168, 236, 0.6)',
        },
    },
    {
        selector: 'node[^hasChildren].in-active-selection',
        style: {
            'background-color': 'rgba(82, 168, 236, 0.6)',
        },
    },
    // {
    //     selector: 'edge.in-active-selection',
    //     style: {
    //         width: 5,
    //         'line-color': 'rgba(82, 168, 236, 0.6)',
    //     },
    // },
];

const coseBilkentOptions = {
    name: 'cose-bilkent',
    // Called on `layoutready`
    ready: function ready() {
        console.log('coseBilkent ready');
    },
    // Called on `layoutstop`
    stop: function stop() {
        console.log('coseBilkent stop');
    },
    // Whether to include labels in node dimensions. Useful for avoiding label overlap
    nodeDimensionsIncludeLabels: true,
    // number of ticks per frame; higher is faster but more jerky
    refresh: 30,
    // Whether to fit the network view after when done
    fit: true,
    // Padding on fit
    padding: 10,
    // Whether to enable incremental mode
    randomize: true,
    // Node repulsion (non overlapping) multiplier
    nodeRepulsion: 4500,
    // Ideal (intra-graph) edge length
    idealEdgeLength: 50,
    // Divisor to compute edge forces
    edgeElasticity: 0.45,
    // Nesting factor (multiplier) to compute ideal edge length for inter-graph edges
    nestingFactor: 0.1,
    // Gravity force (constant)
    gravity: 0.25,
    // Maximum number of iterations to perform
    numIter: 2500,
    // Whether to tile disconnected nodes
    tile: true,
    // Type of layout animation. The option set is {'during', 'end', false}
    animate: 'end',
    // Amount of vertical space to put between degree zero nodes during tiling (can also be a function)
    tilingPaddingVertical: 10,
    // Amount of horizontal space to put between degree zero nodes during tiling (can also be a function)
    tilingPaddingHorizontal: 10,
    // Gravity range (constant) for compounds
    gravityRangeCompound: 1.5,
    // Gravity force (constant) for compounds
    gravityCompound: 1.0,
    // Gravity range (constant)
    gravityRange: 3.8,
    // Initial cooling factor for incremental layout
    initialEnergyOnIncremental: 0.5,
};

export default class GraphEditor extends Component {
    static propTypes = {
        gmeClient: PropTypes.object.isRequired,
        activeNode: PropTypes.string,
        activeSelection: PropTypes.arrayOf(PropTypes.string).isRequired,
        nodes: PropTypes.object.isRequired,

        readOnly: PropTypes.bool,
        isActivePanel: PropTypes.bool,
        width: PropTypes.number,
        height: PropTypes.number,

        setActiveSelection: PropTypes.func.isRequired,
        setActiveNode: PropTypes.func.isRequired,
        validFilters: PropTypes.object,
    };

    static defaultProps = {
        readOnly: false,
        isActivePanel: true,
        activeNode: null,
        width: 0,
        height: 0,
        validFilters: {
            pointers: [],
            sets: [],
            nodes: [],
        },
    };

    constructor(props) {
        super(props);
        this.reposition = {};
        this.cyId = `cy-${Date.now()}`;
    }

    state = {
        showNodeMenu: null,
        activeFilters: (() => {
            const {validFilters} = this.props;
            const res = {};

            Object.keys(validFilters).forEach((filterType) => {
                validFilters[filterType].forEach((f) => {
                    res[`${filterType}$${f.name}`] = f.active;
                });
            });

            // {
            //  'sets$members': true,
            //  'nodes$MyMetaType: false,
            // }

            return res;
        })(),
        showFilterSelector: false,
    };

    componentWillReceiveProps(newProps) {
        const {activeNode} = newProps;

        if (activeNode !== this.props.activeNode) {
            this.reposition = {};
        }
    }

    onListItemClick = id => (
        (/* e */) => {
            this.props.setActiveSelection([id]);
        })

    onListItemDoubleClick = id => (
        (/* e */) => {
            this.props.setActiveNode(id);
        })

    getCytoscapeElements() {
        const {
            activeNode,
            readOnly,
            activeSelection,
            nodes,
        } = this.props;
        const {activeFilters} = this.state;
        // https://github.com/ybarukh/react-cytoscape/blob/master/sample/app/Graph.js
        // http://js.cytoscape.org/#notation/elements-json
        const result = {
            elements: {
                nodes: [],
                edges: [],
            },
            style: [],
        };

        const nodeMap = {};
        const nodeIdsWithChildren = {};

        const getPosition = (id) => {
            const parentNode = nodes[id];

            // while (parentNode.parent &&
            // parentNode.parent !== activeNode &&
            // !parentNode[CONSTANTS.CYTOSCAPE_POS_REG_KEY]) {
            //     parentNode = children[parentNode.parent];
            // }

            return JSON.parse(JSON.stringify(parentNode.registries[CONSTANTS.CYTOSCAPE_POS_REG_KEY] ||
                parentNode.registries.position));
        };

        Object.keys(nodes).forEach((id) => {
            if (id === activeNode) {
                return;
            }

            const childData = nodes[id];

            if (activeFilters[`nodes$${childData.metaType}`]) {
                return;
            }

            if (typeof childData.pointers.src === 'string' && typeof childData.pointers.dst === 'string') {
                result.elements.edges.push({
                    data: {
                        id,
                        source: childData.pointers.src,
                        target: childData.pointers.dst,
                        label: childData.attributes.name,
                    },
                    classes: `${activeSelection.includes(id) ? 'in-active-selection ' : ''}gme-connection`,
                });
            } else {
                const cytoData = {
                    data: {
                        id,
                        name: childData.attributes.name,
                        label: childData.attributes.label ?
                            `${childData.attributes.name}::${childData.attributes.label}` : childData.attributes.name,
                        parent: childData.parent,
                        metaType: childData.metaType,
                    },
                    position: getPosition(id),
                    grabbable: !readOnly,
                    classes: `${activeSelection.includes(id) ? 'in-active-selection' : ''}`,
                };

                if (ATTACK_MODEL_NODES.indexOf(childData.metaType) > -1) {
                    cytoData.data.attackModelNode = true;
                    cytoData.data.label = `${childData.attributes.name}${'\n'}`;

                    cytoData.data.label += Object.keys(childData.attributes).map((attrName) => {
                        if (attrName === 'id' || attrName === 'name' || childData.attributes[attrName] === '') {
                            return '';
                        }

                        return `${attrName}: ${childData.attributes[attrName]}${'\n'}`;
                    }).join('');
                }

                result.elements.nodes.push(cytoData);

                // Keep track of the containers s.t. they cannot be grabbed.
                nodeMap[id] = result.elements.nodes[result.elements.nodes.length - 1];
                if (childData.parent !== activeNode) {
                    nodeIdsWithChildren[childData.parent] = true;
                }

                Object.keys(childData.sets).forEach((setName) => {
                    if (!childData.sets[setName] || activeFilters[`sets$${setName}`]) {
                        return;
                    }

                    childData.sets[setName].forEach((setMemberData) => {
                        const edgeId = `${id}$${setName}$${setMemberData.id}`;
                        const edgeData = {
                            data: {
                                id: edgeId,
                                source: id,
                                target: setMemberData.id,
                                label: setName,
                                memberAttrs: setMemberData.memberAttrs,
                            },
                            classes: `set-member ${activeSelection.includes(edgeId) ? 'in-active-selection' : ''}`,
                        };

                        if (setMemberData.label !== null) {
                            edgeData.data.label = setMemberData.label;
                        }

                        result.elements.edges.push(edgeData);
                    });
                });

                Object.keys(childData.pointers).forEach((pName) => {
                    if (!childData.pointers[pName] || activeFilters[`pointers$${pName}`]) {
                        return;
                    }

                    const edgeId = `${id}$${pName}$${childData.pointers[pName]}`;
                    const edgeData = {
                        data: {
                            id: edgeId,
                            source: id,
                            target: childData.pointers[pName],
                            label: pName,
                        },
                        classes: `${pName === 'base' ? 'base-pointer' : 'pointer'}\
${activeSelection.includes(edgeId) ? ' in-active-selection' : ''}`,
                    };

                    result.elements.edges.push(edgeData);
                });

                // Use the images defined for the node.
                if (childData.registries.SVGIcon && childData.registries.SVGIcon.indexOf('<') === -1) {
                    result.style.push({
                        selector: `node[id = "${id}"]`,
                        style: {
                            'background-image': `url(/assets/DecoratorSVG/${childData.registries.SVGIcon})`,
                        },
                    });
                }
            }
        });

        Object.keys(nodeIdsWithChildren).forEach((id) => {
            nodeMap[id].data.hasChildren = true;
        });

        return result;
    }

    storePosition = (nodeId) => {
        const {gmeClient} = this.props;

        if (Object.keys(this.reposition).length > 0) {
            gmeClient.startTransaction();
            Object.keys(this.reposition).forEach((id) => {
                if (id.indexOf(nodeId) === 0 || nodeId.indexOf(id) === 0) {
                    gmeClient.setRegistry(
                        id,
                        CONSTANTS.CYTOSCAPE_POS_REG_KEY,
                        this.reposition[id].position,
                    );
                }
            });

            gmeClient.completeTransaction();
        }

        this.reposition = {};
    };

    showFilterSelector = () => {

    };

    toggleFilter = (filterId) => {
        this.setState({
            activeFilters: update(
                this.state.activeFilters,
                {[filterId]: {$set: !this.state.activeFilters[filterId]}},
            ),
        });
    };

    attachCytoscapeHandlers() {
        this.cy.on('position', (e) => {
            const cyNode = e.target;
            const childNodeDesc = this.props.nodes[cyNode.id()];
            const floorPos = {
                x: Math.floor(cyNode.position().x),
                y: Math.floor(cyNode.position().y),
            };

            if (childNodeDesc &&
                (!childNodeDesc[CONSTANTS.CYTOSCAPE_POS_REG_KEY] ||
                    childNodeDesc[CONSTANTS.CYTOSCAPE_POS_REG_KEY].x !== floorPos.x ||
                    childNodeDesc[CONSTANTS.CYTOSCAPE_POS_REG_KEY].y !== floorPos.y)) {
                this.reposition[cyNode.id()] = {
                    id: cyNode.id(),
                    position: floorPos,
                };
            }
        });

        this.cy.on('free', (e) => {
            const cyNode = e.target;
            if (typeof cyNode.id === 'function') {
                // console.log('free', cyNode.id(), JSON.stringify(this.reposition));
                this.storePosition(cyNode.id());
                setTimeout(() => {
                    this.props.setActiveSelection([e.target.id()]);
                });
            } else {
                // Free outside of canvas
                this.reposition = {};
                this.props.setActiveSelection([]);
            }
        });

        this.cy.on('vclick', (e) => {
            this.reposition = {};
            if (typeof e.target.id === 'function') {
                // console.log('vclick', e.target.id(), JSON.stringify(this.reposition));
                this.setState({
                    showNodeMenu: {
                        id: e.target.id(),
                        data: e.target.data(),
                        position: {
                            x: e.originalEvent.clientX,
                            y: e.originalEvent.clientY,
                        },
                    },
                });

                setTimeout(() => {
                    this.props.setActiveSelection([e.target.id()]);
                });
            } else {
                this.props.setActiveSelection([]);
            }
        });
    }

    render() {
        const {
            showNodeMenu,
            showFilterSelector,
        } = this.state;
        const {
            readOnly,
            width,
            height,
            isActivePanel,
            gmeClient,
            activeNode,
            activeSelection,
            nodes,
        } = this.props;

        const cytoData = this.getCytoscapeElements();

        const activeNodeName = nodes[activeNode] ? nodes[activeNode].attributes.name : '';

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={{
                    position: 'absolute',
                    top: 5,
                    left: 10,
                    zIndex: 4,
                }}
                >
                    {readOnly ? <LockIcon/> : null}
                    <span
                        style={{fontSize: 24, color: isActivePanel ? null : 'grey'}}
                    >
                        {activeNodeName}
                        <Tooltip id="tooltip-auto-layout" title="Run auto-layout. Warning this will move everything!">
                            <Button
                                onClick={() => {
                                    const layout = this.cy.layout(coseBilkentOptions);
                                    layout.on('layoutstop', () => {
                                        this.storePosition(activeNode);
                                    });
                                    layout.run();
                                }}
                            >
                                <TransformIcon/>
                            </Button>
                        </Tooltip>
                        <Tooltip id="tooltip-dagre-layout" title="Run Dagre-layout. Warning this will move everything!">
                            <Button
                                onClick={() => {
                                    const layout = this.cy.layout({name: 'dagre'});
                                    layout.on('layoutstop', () => {
                                        this.storePosition(activeNode);
                                    });
                                    layout.run();
                                }}
                            >
                                <TransformIcon/>
                            </Button>
                        </Tooltip>
                        <Tooltip id="tooltip-fit-to-screen" title="Fit to screen">
                            <Button
                                onClick={() => {
                                    this.cy.fit();
                                }}
                            >
                                <FullscreenIcon/>
                            </Button>
                        </Tooltip>
                        <Tooltip id="tooltip-show-filters" title="Manage filters">
                            <Button
                                onClick={() => {
                                    this.setState({showFilterSelector: true});
                                }}
                            >
                                <FilterIcon/>
                            </Button>
                        </Tooltip>
                    </span>
                </div>
                <ReactCytoscape
                    containerID={this.cyId}
                    width={width}
                    height={height}
                    elements={cytoData.elements}
                    cyRef={(cy) => {
                        if (!this.cy) {
                            this.cy = cy;
                            this.attachCytoscapeHandlers();
                        }
                    }}
                    cytoscapeOptions={{wheelSensitivity: 0.1}}
                    layout={{name: 'preset'/* preset dagre */}}
                    style={DEFAULT_STYLES.concat(cytoData.style)}
                />
                {showNodeMenu && showNodeMenu.id === activeSelection[0] ?
                    <ContextMenu
                        gmeClient={gmeClient}
                        nodeId={showNodeMenu.id}
                        data={showNodeMenu.data}
                        eventX={showNodeMenu.position.x}
                        eventY={showNodeMenu.position.y}
                        onClose={() => {
                            this.setState({showNodeMenu: null});
                        }}
                        setActiveNode={this.props.setActiveNode}
                    /> : null}

                <FilterSelector
                    open={showFilterSelector}
                    validItems={this.props.validFilters}
                    activeItems={this.state.activeFilters}
                    handleToggle={this.toggleFilter}
                    onClose={(() => this.setState({showFilterSelector: false}))}
                />
            </div>);
    }
}
