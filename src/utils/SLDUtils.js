/* copyright 2018, stefano bovio @allyoucanmap. */

import {head, isEmpty, isObject, isArray, capitalize, isNil, trim, startsWith, endsWith, trimStart, trimEnd} from 'lodash';
import xml2js from 'xml2js';
import {scales} from './PrjUtils';
import uuidv1 from 'uuid/v1';

const xmlParser = new xml2js.Parser();
const xmlBuilder = new xml2js.Builder({
    xmldec: {
        version: '1.0',
        encoding: 'ISO-8859-1',
        standalone: false
    },
    renderOpts: {
        pretty: false,
        indent: '',
        newline: ''
    }
});

const hasParams = (params, keys) => head(keys.filter(key => head(Object.keys(params).filter(param => !isNil(params[param]) && param === key))));

const vendorOptions = (params = {}, keys = [], translate = {}) => hasParams(params, keys) && {
    VendorOption: keys.filter(key => !isNil(params[key])).map(name => ({
        $: {
            name: translate[name] || name
        },
        _: params[name]
    }))
} || {};

const functionTypes = [
    {
        name: 'env',
        builder: literal => 'env(' + literal + ')'
    }
];

const getFunction = (name) => {
    const trimmedValue = trim(name);
    const isFunction = head(functionTypes.filter(type => startsWith(trimmedValue, type.name + '(')));
    
    if (isFunction && endsWith(trimmedValue, ')')) {
        const literal = trim(trimEnd(trimStart(name, isFunction.name + '('), ')'));
        return {
            'ogc:Function': {
                $: {
                    name: isFunction.name
                },
                'ogc:Literal': literal
            }
        }
    }
    return {
        'ogc:PropertyName': name || ' _am_ '
    };
};

const getTransformationFunction = obj => ({
    'ogc:Function': {
        ...getFunction(obj.name, obj.list),
        'ogc:Literal': isArray(obj.list) && [...(obj.type === 'interpolate' ? [{value: 'color'}] : []), ...obj.list].reverse().reduce((literals, {literal, value}) => [...literals, literal, value], []).filter(val => !isNil(val)) || [' _am_ ', ' _am_ '],
        $: {
            name: obj.type && capitalize(obj.type) || 'Recode'
        }
    }
});

const getCSSParam = (params, key) => !isNil(params[key]) &&
[
    {
        CssParameter: {
            ...(isObject(params[key]) && getTransformationFunction(params[key]) || { _: params[key] }),
            $: {
                name: key
            }
        }
    }
] || [];

const styleFunctions = {
    fill: (params = {}) => hasParams(params, [
        'fill',
        'fill-opacity'
    ]) && {
        Fill: [
            {
                $_am: [
                    ...getCSSParam(params, 'fill'),
                    ...getCSSParam(params, 'fill-opacity')
                ]
            }
        ]
    } || {},
    stroke: (params = {}) => hasParams(params, [
        'stroke',
        'stroke-width',
        'stroke-opacity',
        'stroke-linejoin',
        'stroke-linecap',
        'stroke-dasharray',
        'stroke-dashoffset'
    ]) && {
        Stroke: [
            {
                $_am: [
                    ...getCSSParam(params, 'stroke'),
                    ...getCSSParam(params, 'stroke-width'),
                    ...getCSSParam(params, 'stroke-opacity'),
                    ...getCSSParam(params, 'stroke-linejoin'),
                    ...getCSSParam(params, 'stroke-linecap'),
                    ...getCSSParam(params, 'stroke-dasharray'),
                    ...getCSSParam(params, 'stroke-dashoffset')
                ]
            }
        ]
    } || {},
    perpendicularOffset: (params = {}) => hasParams(params, [
        'perpendicular-offset'
    ]) && {
        PerpendicularOffset: params['perpendicular-offset']
    } || {},
    infoRule: (name, title, abstract) => ({
        ...(name && {Name: [name]} || {}),
        ...(title && {Title: [title]} || {}),
        ...(abstract && {Abstract: [abstract]} || {})
    }),
    Font: (params = {}) => hasParams(params, [
        'font-family',
        'font-style',
        'font-weight',
        'font-size'
    ]) && {
        Font: [
            {
                $_am: [
                    ...getCSSParam(params, 'font-family'),
                    ...getCSSParam(params, 'font-style'),
                    ...getCSSParam(params, 'font-weight'),
                    ...getCSSParam(params, 'font-size')
                ]
            }
        ]
    } || {},
    Mark: (params = {}) => hasParams(params, [
        'wellknownname',
        'size',
        'fill',
        'fill-opacity',
        'stroke',
        'stroke-width',
        'stroke-opacity',
        'stroke-linejoin',
        'stroke-linecap',
        'stroke-dasharray',
        'stroke-dashoffset'
    ]) && ({
        Graphic: {
            Mark: {
                ...(params.wellknownname ? {WellKnownName: [params.wellknownname]} : {}),
                ...styleFunctions.fill(params),
                ...styleFunctions.stroke(params)
            },
            ...(params.size ? {Size: [params.size]} : {}),
            ...(params.rotation ? {Rotation: [params.rotation]} : {}),
        }
    }) || {},
    PointSymbolizer: (params) => hasParams(params, [
        'wellknownname',
        'url',
        'format',
        'size',
        'fill',
        'fill-opacity',
        'stroke',
        'stroke-width',
        'stroke-opacity',
        'stroke-linejoin',
        'stroke-linecap',
        'stroke-dasharray',
        'stroke-dashoffset'
    ]) && {
        PointSymbolizer: [
            {
                ...styleFunctions.Mark(params)
            }
        ]
    } || {},
    PolygonSymbolizer: (params) => hasParams(params, [
        'fill',
        'fill-opacity',
        'stroke',
        'stroke-width',
        'stroke-opacity',
        'stroke-linejoin',
        'stroke-linecap',
        'stroke-dasharray',
        'stroke-dashoffset'
    ]) && {
        PolygonSymbolizer: [
            {
                ...styleFunctions.fill(params),
                ...styleFunctions.stroke(params)
            }
        ]
    } || {},
    LineSymbolizer: (params) => hasParams(params, [
        'stroke',
        'stroke-width',
        'stroke-opacity',
        'stroke-linejoin',
        'stroke-linecap',
        'stroke-dasharray',
        'stroke-dashoffset',
        'perpendicular-offset'
    ]) && {
        LineSymbolizer: [
            {
                ...styleFunctions.stroke(params),
                ...styleFunctions.perpendicularOffset(params)
            }
        ]
    } || {},
    TextSymbolizer: (params) => hasParams(params, [
        'label',
        'fill',
        'fill-opacity'
    ]) && {
        TextSymbolizer: {
            ...(params.label ? {
                Label: {
                    'ogc:PropertyName': params.label
                }
            } : {}),
            ...styleFunctions.Font(params),
            ...styleFunctions.fill(params)
        }
    } || {},
    StyledLayerDescriptor: (name, title, abstract, featureTypeStyle = []) => ({
        StyledLayerDescriptor: {
            $: {
                'version': '1.0.0',
                'xmlns': 'http://www.opengis.net/sld',
                'xmlns:ogc': 'http://www.opengis.net/ogc',
                'xmlns:xlink': 'http://www.w3.org/1999/xlink',
                'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                'xmlns:gml': 'http://www.opengis.net/gml'
            },
            NamedLayer: [
                {
                    ...(name && {Name: [name]} || {}),
                    UserStyle: [
                        {
                            ...(name && {Name: [name]} || {}),
                            ...(title && {Title: [title]} || {}),
                            ...(abstract && {Abstract: [abstract]} || {}),
                            FeatureTypeStyle: [...featureTypeStyle]
                        }
                    ]
                }
            ]
        }
    })
};

const Fill = [
    'fill',
    'fill-opacity'
];

const Stroke = [
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'stroke-linejoin',
    'stroke-linecap',
    'stroke-dasharray',
    'stroke-dashoffset'
];

const PointSymbolizer = [
    'wellknownname',
    // 'url',
    // 'format',
    'size',
    'rotation',
    ...Fill,
    ...Stroke
];

const LineSymbolizer = [
    ...Stroke,
    'perpendicular-offset'
];

const PolygonSymbolizer = [
    ...Fill,
    ...Stroke
];

const TextSymbolizer = [
    'label',
    'font-family',
    'font-style',
    'font-weight',
    'font-size',
    ...Fill
];

const FeatureTypeStyle = [
    'label',
    'sort-by',
    'sort-by-group'
];

const types = {
    'name': {
        format: 'text'
    },
    'title': {
        format: 'text'
    },
    'abstract': {
        format: 'text'
    },
    'fill': {
        format: 'color',
        path: '',
        transformation: true
    },
    'fill-opacity': {
        format: 'number',
        range: {
            min: 0,
            max: 1
        },
        transformation: true
    },
    'stroke': {
        format: 'color',
        transformation: true
    },
    'stroke-width': {
        format: 'number',
        range: {
            min: 0,
            max: 20
        },
        transformation: true
    },
    'stroke-opacity': {
        format: 'number',
        range: {
            min: 0,
            max: 1
        },
        transformation: true
    },
    'stroke-linejoin': {
        format: 'select',
        base: 'mitre',
        options: [
            'mitre',
            'round',
            'bevel'
        ]
    },
    'stroke-linecap': {
        format: 'select',
        base: 'butt',
        options: [
            'butt',
            'round',
            'square'
        ]
    },
    'stroke-dasharray': {
        format: 'text',
        transformation: true
    },
    'stroke-dashoffset': {
        format: 'text'
    },
    'perpendicular-offset': {
        format: 'number',
        range: {
            min: 0,
            max: 50
        }
    },
    'wellknownname': {
        format: 'text'
    },
    'url': {
        format: 'text'
    },
    'format': {
        format: 'text'
    },
    'size': {
        format: 'number',
        range: {
            min: 0,
            max: 50
        }
    },
    'label': {
        format: 'text'
    },
    'font-family': {
        format: 'text'
    },
    'font-style': {
        format: 'select',
        base: 'normal',
        options: [
            'normal',
            'italic'
        ]
    },
    'font-weight': {
        format: 'select',
        base: 'normal',
        options: [
            'normal',
            'bold'
        ]
    },
    'font-size': {
        format: 'number',
        range: {
            min: 0,
            max: 50
        }
    },
    'rotation': {
        format: 'number',
        range: {
            min: -360,
            max: 360
        }
    },
    'sort-by': {
        format: 'text'
    },
    'sort-by-group': {
        format: 'text'
    }
};

const logicalOperators = {
    'AND': {
        _: 'And'
    },
    'OR': {
        _: 'Or'
    }
};

const comparisonOperators = {
    '==': {
        _: 'PropertyIsEqualTo'
    },
    '!=': {
        _: 'PropertyIsNotEqualTo'
    },
    '>': {
        _: 'PropertyIsGreaterThan'
    },
    '>=': {
        _: 'PropertyIsGreaterThanOrEqualTo'
    },
    '<': {
        _: 'PropertyIsLessThan'
    },
    '<=': {
        _: 'PropertyIsLessThanOrEqualTo'
    },
    'isNull': {
        _: 'PropertyIsNull',
        validate: ({param}) => !isNil(param),
        hideValue: true
    }
};

const filtersFunctions = {
    validate: filters => {
        const validFilters = filters.filter(({param, value, operator, rules}) => comparisonOperators[operator] && comparisonOperators[operator].validate && comparisonOperators[operator].validate({param, value, operator, rules}) || 
            (!isNil(param) && !isNil(value) && !isNil(operator) || !isNil(operator) && !isNil(rules)));
        return head(validFilters) && validFilters;
    },
    writeObject: filters => {
        const validFilters = filtersFunctions.validate(filters);
        const operators = {...logicalOperators, ...comparisonOperators};
        return validFilters && validFilters.reduce((newFilters, currentFilter) => {
            const filter = currentFilter && currentFilter.rules && currentFilter.rules.length === 1 && {...currentFilter.rules[0]} || {...currentFilter};
            const hasValues = filter.param !== '' && (comparisonOperators[filter.operator] && (comparisonOperators[filter.operator].hideValue || !comparisonOperators[filter.operator].hideValue && filter.value !== ''));
            const rule = filter.rules ? {
                ...filtersFunctions.writeObject(filter.rules)
            } : {
                ...(hasValues ? {'ogc:PropertyName': filter.param} : {}),
                ...(hasValues && !comparisonOperators[filter.operator].hideValue ? {'ogc:Literal': filter.value} : {})
            };
            const obj = !isEmpty(rule) && {
                [operators[filter.operator]._]: [
                    ...(newFilters[operators[filter.operator]._] || []),
                    rule
                ]
            } || {};
            return { 
                ...newFilters,
                ...obj
            };
        }, {}) || {};
    },
    filters: filters => {
        const validFilters = filtersFunctions.writeObject(filters);
        return !isEmpty(validFilters) ? {
            'ogc:Filter': {
                ...validFilters
            }
        } : {}
    },
    scalesDenominators: scales => scales && ({
        ...(!isNil(scales.minScaleDenominator) ? {MinScaleDenominator: scales.minScaleDenominator} : {}),
        ...(!isNil(scales.maxScaleDenominator) ? {MaxScaleDenominator: scales.maxScaleDenominator} : {})
    }) || {}
};

const prefixes = ['ogc:', 'sld:', ''];

const parser = {
    fromKey: (key, sldObj) => {
        return sldObj && head(prefixes.map(prefix => sldObj[prefix + key]).filter(val => val));
    },
    Label: rule => {
        const Label = parser.fromKey('Label', rule);
        const PropertyName = parser.fromKey('PropertyName', Label[0]);
        return isArray(PropertyName) && PropertyName[0] && {
            label: PropertyName[0]
        } || PropertyName && {
            label: PropertyName
        } || {}
    },
    extractFunction: func => {
        const funcName = func && func.$ && func.$.name;
        const builder = head(functionTypes.filter(type => type.name === funcName).map(type => type.builder));
        const literal = head(func && parser.fromKey('Literal', func) || []);
        return !isNil(builder) && !isNil(literal) && builder(literal);
    },
    extractTransformation: func => {
        const sldLiterals = parser.fromKey('Literal', func);
        const type = func && func.$ && func.$.name && func.$.name.toLowerCase();
        const sldFunction = head(parser.fromKey('Function', func) || []);
        const name =  head(parser.fromKey('PropertyName', func) || []) || parser.extractFunction(sldFunction);
        const firstValue = type === 'categorize' && isArray(sldLiterals) && [{value: sldLiterals[0]}] || [];
        
        const literals = isArray(sldLiterals) && (
            type === 'recode' && [...sldLiterals]
            || type === 'categorize' && sldLiterals.filter((literal, idx) => idx > 0)
            || type === 'interpolate' && sldLiterals.filter((literal, idx) => !(idx === sldLiterals.length - 1 && head(['numeric', 'color'].filter(val => val === literal))))
        ) || [];

        const list = literals.reduce((newList, literal, idx) => {
            return idx % 2 === 0 ? [
                ...newList,
                {
                    value: literals[idx + 1],
                    literal: literals[idx]
                }
            ] : [...newList]
        }, []);

        const finalList = [...firstValue, ...list].filter(val => !isNil(val));
        return sldLiterals && ((type === 'categorize' && sldLiterals.length % 2 !== 0)
        || (type !== 'categorize' && sldLiterals.length % 2 === 0))
        && !isNil(literals) && isArray(literals) && !isNil(type) && !isNil(name) && {
            name,
            type,
            list: [...finalList].reverse()
        } || '';
    },
    extractCSS: (key, rule) => {
        const sldKey = parser.fromKey(key, rule);
        const cssParameters = isArray(sldKey) && sldKey[0] && parser.fromKey('CssParameter', sldKey[0]);
        return cssParameters && cssParameters.reduce((newParams, css) => {
            const name = css && css.$ && css.$.name;
            const value = css && css._;
            const func = head(parser.fromKey('Function', css) || []);
            return !isNil(name) && (!isNil(value) || !isNil(func)) && {
                ...newParams,
                [name]: func && parser.extractTransformation(func) || value
            };
        }, {}) || {};
    },
    infoRule: (rule) => {
        const sldName = parser.fromKey('Name', rule);
        const sldTitle = parser.fromKey('Title', rule);
        const sldAbstract = parser.fromKey('Abstract', rule);

        const name = isArray(sldName) && head(sldName) || undefined;
        const title = isArray(sldTitle) && head(sldTitle) || undefined;
        const abstract = isArray(sldAbstract) && head(sldAbstract) || undefined;

        return [
            {
                name: 'Name',
                value: name
            },
            {
                name: 'Title',
                value: title
            },
            {
                name: 'Abstract',
                value: abstract
            }
        ];
    },
    scales: rule => {
        const sldMinScaleDenominator = parser.fromKey('MinScaleDenominator', rule);
        const sldMaxScaleDenominator = parser.fromKey('MaxScaleDenominator', rule);

        const minScaleDenominator = isArray(sldMinScaleDenominator) && parseFloat(head(sldMinScaleDenominator));
        const maxScaleDenominator = isArray(sldMaxScaleDenominator) && parseFloat(head(sldMaxScaleDenominator));
        
        const minScaleValue = minScaleDenominator && scales.reduce((previous, current) => {
            return Math.abs(current - minScaleDenominator) < Math.abs(previous - minScaleDenominator) ? current : previous;
        });
        
        const minScale = scales.indexOf(minScaleValue) > -1 ? {
            maxZoom: scales.indexOf(minScaleValue),
            minScaleDenominator
        } : {};

        const maxScaleValue = maxScaleDenominator && scales.reduce((previous, current) => {
            return Math.abs(current - maxScaleDenominator) < Math.abs(previous - maxScaleDenominator) ? current : previous;
        });
        
        const maxScale = scales.indexOf(maxScaleValue) > -1 ? {
            minZoom: scales.indexOf(maxScaleValue),
            maxScaleDenominator
        } : {};

        return {
            ...minScale,
            ...maxScale
        };
    },
    filters: (filter, start) => {
        const Or = parser.fromKey('Or', filter);
        const orObjRules = Or && Or.map(sldOr => {
            return parser.filters(sldOr);
        });

        const orObj = orObjRules && orObjRules.map(rules => ({
            type: 'group',
            operator:  'OR',
            rules
        })) || [];
        
        const And = parser.fromKey('And', filter);
        const andObjRules = And && And.map(sldAnd => {
            return parser.filters(sldAnd);
        });

        const andObj = andObjRules && andObjRules.map(rules => ({
            type: 'group',
            operator:  'AND',
            rules
        })) || [];

        const comparisons = Object.keys(comparisonOperators).reduce((newRules, operator) => {
            const comparisonOperator = parser.fromKey(comparisonOperators[operator]._, filter);
            const rules = comparisonOperator && comparisonOperator.map(op => {
                const param = head(parser.fromKey('PropertyName', op) || []);
                const value = head(parser.fromKey('Literal', op) || []);
                return {
                    operator,
                    param,
                    value,
                    type: 'input'
                };
            }) || [];
            return [
                ...newRules,
                ...rules
            ];
        }, []);
        return start ?
        {
            ...(orObj && orObj[0] || andObj && andObj[0] || {
                type: 'group',
                operator:  'AND',
                rules: [...comparisons]
            })
        }
        : 
        [
            ...comparisons,
            ...andObj,
            ...orObj
        ];
    },
    PerpendicularOffset: rule => {
        const perpendicularOffset = head(parser.fromKey('PerpendicularOffset', rule) || []);
        return perpendicularOffset && {
            'perpendicular-offset': perpendicularOffset
        } || {};
    },
    Mark: rule => {
        const Graphic = head(parser.fromKey('Graphic', rule) || []);
        const Mark = head(parser.fromKey('Mark', Graphic) || []);
        const wellknownname = head(parser.fromKey('WellKnownName', Mark) || []);
        const size = head(parser.fromKey('Size', Graphic) || []);
        const rotation =  head(parser.fromKey('Rotation', Graphic) || []);
        return {
            ...(wellknownname ? {wellknownname} : {}),
            ...parser.extractCSS('Fill', Mark),
            ...parser.extractCSS('Stroke', Mark),
            ...(size ? {size} : {}),
            ...(rotation ? {rotation} : {})
        }; 
    },
    PointSymbolizer: rule => ({
        _id: uuidv1(),
        _: 'PointSymbolizer',
        ...parser.extractCSS('Fill', rule),
        ...parser.extractCSS('Stroke', rule),
        ...parser.Mark(rule)
    }),
    LineSymbolizer: rule => ({
        _id: uuidv1(),
        _: 'LineSymbolizer',
        ...parser.extractCSS('Stroke', rule),
        ...parser.PerpendicularOffset(rule)
    }),
    PolygonSymbolizer: rule => ({
        _id: uuidv1(),
        _: 'PolygonSymbolizer',
        ...parser.extractCSS('Fill', rule),
        ...parser.extractCSS('Stroke', rule)
    }),
    TextSymbolizer: rule => ({
        _id: uuidv1(),
        _: 'TextSymbolizer',
        ...parser.Label(rule),
        ...parser.extractCSS('Font', rule),
        ...parser.extractCSS('Fill', rule)
    })
};

const parseVendorOptions = (options = [], translate = {}) => {
    return options.reduce((newOptions, option) => {
        const name = option && option.$ && option.$.name;
        const value = option && option._;
        return {
            ...newOptions,
            ...(!isNil(name) && !isNil(value) ? {[translate[name] || name]: value} : {})
        };
    }, {});
};

const parseStyle = (sld, style = () => {}) => {
    xmlParser.parseString(sld, (err, sldObj) => {
        if (sldObj) {
            const StyledLayerDescriptor = parser.fromKey('StyledLayerDescriptor', sldObj);
            const NamedLayer = parser.fromKey('NamedLayer', StyledLayerDescriptor);
            const UserStyle = parser.fromKey('UserStyle', NamedLayer[0]);
            const FeatureTypeStyle = parser.fromKey('FeatureTypeStyle', UserStyle[0]);
            
            const rules = FeatureTypeStyle.reduce((newRules, featureType) => {

                const label = head(parser.fromKey('Name', featureType) || []);
                const sldVendorOptions = parser.fromKey('VendorOption', featureType);
                const vendor = parseVendorOptions(sldVendorOptions || [], {'sortBy': 'sort-by', 'sortByGroup': 'sort-by-group'});
                const sldRules = parser.fromKey('Rule', featureType);
                if (!sldRules) {
                    return [
                        ...newRules
                    ];
                }
                const group = {
                    id: uuidv1(),
                    label,
                    type: 'group',
                    rule: [
                        {   
                            _id: uuidv1(),
                            _: 'FeatureTypeStyle',
                            label,
                            ...vendor
                        }
                    ]
                };

                const rules = sldRules.map(sldRule => {
                    const general = parser.infoRule(sldRule);
                    const Filter = parser.fromKey('Filter', sldRule) || {
                        type: 'group',
                        operator:  'AND',
                        rules: []
                    };
                    const filters = Filter && parser.filters(Filter[0], true);
                    const sldPolygonSymbolizer = parser.fromKey('PolygonSymbolizer', sldRule);
                    const polygonSymbolizers = sldPolygonSymbolizer && sldPolygonSymbolizer.map(symbol => parser.PolygonSymbolizer(symbol)) || [];
                    const sldLineSymbolizer = parser.fromKey('LineSymbolizer', sldRule);
                    const lineSymbolizers = sldLineSymbolizer && sldLineSymbolizer.map(symbol => parser.LineSymbolizer(symbol)) || [];
                    const sldPointSymbolizer = parser.fromKey('PointSymbolizer', sldRule);
                    const pointSymbolizers = sldPointSymbolizer && sldPointSymbolizer.map(symbol => parser.PointSymbolizer(symbol)) || [];
                    const sldTextSymbolizer = parser.fromKey('TextSymbolizer', sldRule);
                    const textSymbolizers = sldTextSymbolizer && sldTextSymbolizer.map(symbol => parser.TextSymbolizer(symbol)) || [];
                    const rule = [
                        ...polygonSymbolizers,
                        ...lineSymbolizers,
                        ...pointSymbolizers,
                        ...textSymbolizers
                    ];

                    return {
                        groupId: group && group.id,
                        id: uuidv1(),
                        label: head(general.filter(field => field.name === 'Name').map(field => field.value)) || '',
                        general,
                        rule,
                        scales: parser.scales(sldRule),
                        filters,
                        type: 'layer'
                    };
                });
                return [
                    ...newRules,
                    ...(group && [group] || []),
                    ...rules
                ];
            }, []);

            style({rules});
        }
    });
};

const getSLD = (items, name, id, currentFilter) => {
    const groups = items.filter(item => item.type === 'group');
    
    const layers = items.filter(item => item.type === 'layer').reduce((objLayers, layer) => {
        return {
            ...objLayers,
            [layer.name]: [...(objLayers[layer.name] || []), {...layer}]
        };
    }, {});

    const styles = Object.keys(layers).reduce((newStructure, key) => {
        return {
            ...newStructure,
            [key]: layers[key].reduce((featureTypes, layer) => {
                const group = layer.groupId && head(groups.filter(grp => grp.id === layer.groupId)) || {};
                const name = group.id || '_';
                return {
                    ...featureTypes,
                    [name]: [...(featureTypes[name] || []), {...layer}]
                };
            },{})
        }
    }, {});

    const selectedStyle = !isNil(name) && styles[name] && {[name]: styles[name]};

    if (name && !selectedStyle) {
        return {};
    }

    const slds = Object.keys(selectedStyle || styles).reduce((newRules, layerName) => {
        const grps = Object.keys(styles[layerName]);
        const order = ['_', ...groups.map(group => group.id)].filter(id => head(grps.filter(grp => grp + '' === id + '')));
        const featureTypes = order.map(key => {
            const data = styles[layerName][key].map(layer => {
                const {general, filters, rule, scales} = !isNil(name) && id === layer.id ? currentFilter : layer;
                const sldSymbolizers = rule && rule
                    .map((symbol) => styleFunctions[symbol._] && styleFunctions[symbol._](symbol))
                    .reduce((json, symbol) => {
                        const key = head(Object.keys(symbol));
                        return key && {...json, ...(symbol[key] ? {[key]: json[key] && [...json[key], symbol[key]] || [symbol[key]]} : {}) } || {...json};
                    }, {}) || {};
                const sldInfoRule = general.reduce((infoRule, info) => info.value && {...infoRule, [info.name]: [info.value]} || {...infoRule}, {});    
                const filterRule = filtersFunctions.filters([filters]);
                const scalesDenominators = filtersFunctions.scalesDenominators(scales);
                return {
                    ...sldInfoRule,
                    ...filterRule,
                    ...scalesDenominators,
                    ...sldSymbolizers
                };
            });
            const group = head(groups.filter(grp => grp.id + '' === key + '')) || {};
            return {
                Name: group.label || key,
                Rule: [...data],
                ...vendorOptions(group.rule && group.rule[0] || {}, ['sort-by', 'sort-by-group'], {'sort-by': 'sortBy', 'sort-by-group': 'sortByGroup'})
            };
        });
        const styledLayerDescriptor = styleFunctions.StyledLayerDescriptor(
            layerName,
            layerName,
            layerName,
            [...featureTypes]
        );
        const sld = xmlBuilder.buildObject(styledLayerDescriptor).replace(/\<\$_am\>|<\/\$_am\>/g, '');
        return {
            ...newRules,
            [layerName]: sld
        };
    }, {});

    return slds;
};

const symbolizers = {
    PointSymbolizer,
    LineSymbolizer,
    PolygonSymbolizer,
    TextSymbolizer,
    FeatureTypeStyle
};

const operators = {...comparisonOperators};

export {
    symbolizers,
    types,
    styleFunctions,
    operators,
    filtersFunctions,
    parseStyle,
    getSLD
};
