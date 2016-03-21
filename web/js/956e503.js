/*! TableSorter (FORK) v2.21.5 *//*
* Client-side table sorting with ease!
* @requires jQuery v1.2.6+
*
* Copyright (c) 2007 Christian Bach
* fork maintained by Rob Garrison
*
* Examples and docs at: http://tablesorter.com
* Dual licensed under the MIT and GPL licenses:
* http://www.opensource.org/licenses/mit-license.php
* http://www.gnu.org/licenses/gpl.html
*
* @type jQuery
* @name tablesorter (FORK)
* @cat Plugins/Tablesorter
* @author Christian Bach - christian.bach@polyester.se
* @contributor Rob Garrison - https://github.com/Mottie/tablesorter
*/
/*jshint browser:true, jquery:true, unused:false, expr: true */
/*global console:false, alert:false, require:false, define:false, module:false */
;(function($){
    'use strict';
    $.extend({
        /*jshint supernew:true */
        tablesorter: new function() {

            var ts = this;

            ts.version = '2.21.5';

            ts.parsers = [];
            ts.widgets = [];
            ts.defaults = {

                // *** appearance
                theme            : 'default',  // adds tablesorter-{theme} to the table for styling
                widthFixed       : false,      // adds colgroup to fix widths of columns
                showProcessing   : false,      // show an indeterminate timer icon in the header when the table is sorted or filtered.

                headerTemplate   : '{content}',// header layout template (HTML ok); {content} = innerHTML, {icon} = <i/> (class from cssIcon)
                onRenderTemplate : null,       // function(index, template){ return template; }, (template is a string)
                onRenderHeader   : null,       // function(index){}, (nothing to return)

                // *** functionality
                cancelSelection  : true,       // prevent text selection in the header
                tabIndex         : true,       // add tabindex to header for keyboard accessibility
                dateFormat       : 'mmddyyyy', // other options: 'ddmmyyy' or 'yyyymmdd'
                sortMultiSortKey : 'shiftKey', // key used to select additional columns
                sortResetKey     : 'ctrlKey',  // key used to remove sorting on a column
                usNumberFormat   : true,       // false for German '1.234.567,89' or French '1 234 567,89'
                delayInit        : false,      // if false, the parsed table contents will not update until the first sort
                serverSideSorting: false,      // if true, server-side sorting should be performed because client-side sorting will be disabled, but the ui and events will still be used.
                resort           : true,       // default setting to trigger a resort after an 'update', 'addRows', 'updateCell', etc has completed

                // *** sort options
                headers          : {},         // set sorter, string, empty, locked order, sortInitialOrder, filter, etc.
                ignoreCase       : true,       // ignore case while sorting
                sortForce        : null,       // column(s) first sorted; always applied
                sortList         : [],         // Initial sort order; applied initially; updated when manually sorted
                sortAppend       : null,       // column(s) sorted last; always applied
                sortStable       : false,      // when sorting two rows with exactly the same content, the original sort order is maintained

                sortInitialOrder : 'asc',      // sort direction on first click
                sortLocaleCompare: false,      // replace equivalent character (accented characters)
                sortReset        : false,      // third click on the header will reset column to default - unsorted
                sortRestart      : false,      // restart sort to 'sortInitialOrder' when clicking on previously unsorted columns

                emptyTo          : 'bottom',   // sort empty cell to bottom, top, none, zero, emptyMax, emptyMin
                stringTo         : 'max',      // sort strings in numerical column as max, min, top, bottom, zero
                textExtraction   : 'basic',    // text extraction method/function - function(node, table, cellIndex){}
                textAttribute    : 'data-text',// data-attribute that contains alternate cell text (used in default textExtraction function)
                textSorter       : null,       // choose overall or specific column sorter function(a, b, direction, table, columnIndex) [alt: ts.sortText]
                numberSorter     : null,       // choose overall numeric sorter function(a, b, direction, maxColumnValue)

                // *** widget options
                widgets: [],                   // method to add widgets, e.g. widgets: ['zebra']
                widgetOptions    : {
                    zebra : [ 'even', 'odd' ]    // zebra widget alternating row class names
                },
                initWidgets      : true,       // apply widgets on tablesorter initialization
                widgetClass     : 'widget-{name}', // table class name template to match to include a widget

                // *** callbacks
                initialized      : null,       // function(table){},

                // *** extra css class names
                tableClass       : '',
                cssAsc           : '',
                cssDesc          : '',
                cssNone          : '',
                cssHeader        : '',
                cssHeaderRow     : '',
                cssProcessing    : '', // processing icon applied to header during sort/filter

                cssChildRow      : 'tablesorter-childRow', // class name indiciating that a row is to be attached to the its parent
                cssIcon          : 'tablesorter-icon', // if this class does not exist, the {icon} will not be added from the headerTemplate
                cssIconNone      : '', // class name added to the icon when there is no column sort
                cssIconAsc       : '', // class name added to the icon when the column has an ascending sort
                cssIconDesc      : '', // class name added to the icon when the column has a descending sort
                cssInfoBlock     : 'tablesorter-infoOnly', // don't sort tbody with this class name (only one class name allowed here!)
                cssNoSort        : 'tablesorter-noSort',      // class name added to element inside header; clicking on it won't cause a sort
                cssIgnoreRow     : 'tablesorter-ignoreRow',   // header row to ignore; cells within this row will not be added to c.$headers

                // *** selectors
                selectorHeaders  : '> thead th, > thead td',
                selectorSort     : 'th, td',   // jQuery selector of content within selectorHeaders that is clickable to trigger a sort
                selectorRemove   : '.remove-me',

                // *** advanced
                debug            : false,

                // *** Internal variables
                headerList: [],
                empties: {},
                strings: {},
                parsers: []

                // removed: widgetZebra: { css: ['even', 'odd'] }

            };

            // internal css classes - these will ALWAYS be added to
            // the table and MUST only contain one class name - fixes #381
            ts.css = {
                table      : 'tablesorter',
                cssHasChild: 'tablesorter-hasChildRow',
                childRow   : 'tablesorter-childRow',
                colgroup   : 'tablesorter-colgroup',
                header     : 'tablesorter-header',
                headerRow  : 'tablesorter-headerRow',
                headerIn   : 'tablesorter-header-inner',
                icon       : 'tablesorter-icon',
                processing : 'tablesorter-processing',
                sortAsc    : 'tablesorter-headerAsc',
                sortDesc   : 'tablesorter-headerDesc',
                sortNone   : 'tablesorter-headerUnSorted'
            };

            // labels applied to sortable headers for accessibility (aria) support
            ts.language = {
                sortAsc  : 'Ascending sort applied, ',
                sortDesc : 'Descending sort applied, ',
                sortNone : 'No sort applied, ',
                nextAsc  : 'activate to apply an ascending sort',
                nextDesc : 'activate to apply a descending sort',
                nextNone : 'activate to remove the sort'
            };

            // These methods can be applied on table.config instance
            ts.instanceMethods = {};

            /* debuging utils */
            function log() {
                var a = arguments[0],
                    s = arguments.length > 1 ? Array.prototype.slice.call(arguments) : a;
                if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
                    console[ /error/i.test(a) ? 'error' : /warn/i.test(a) ? 'warn' : 'log' ](s);
                } else {
                    alert(s);
                }
            }

            function benchmark(s, d) {
                log(s + ' (' + (new Date().getTime() - d.getTime()) + 'ms)');
            }

            ts.log = log;
            ts.benchmark = benchmark;

            // $.isEmptyObject from jQuery v1.4
            function isEmptyObject(obj) {
                /*jshint forin: false */
                for (var name in obj) {
                    return false;
                }
                return true;
            }

            ts.getElementText = function(c, node, cellIndex) {
                if (!node) { return ''; }
                var te,
                    t = c.textExtraction || '',
                    // node could be a jquery object
                    // http://jsperf.com/jquery-vs-instanceof-jquery/2
                    $node = node.jquery ? node : $(node);
                if (typeof(t) === 'string') {
                    // check data-attribute first when set to 'basic'; don't use node.innerText - it's really slow!
                    return $.trim( ( t === 'basic' ? $node.attr(c.textAttribute) || node.textContent : node.textContent ) || $node.text() || '' );
                } else {
                    if (typeof(t) === 'function') {
                        return $.trim( t($node[0], c.table, cellIndex) );
                    } else if (typeof (te = ts.getColumnData( c.table, t, cellIndex )) === 'function') {
                        return $.trim( te($node[0], c.table, cellIndex) );
                    }
                }
                // fallback
                return $.trim( $node[0].textContent || $node.text() || '' );
            };

            function detectParserForColumn(table, rows, rowIndex, cellIndex) {
                var cur, $node,
                    c = table.config,
                    i = ts.parsers.length,
                    node = false,
                    nodeValue = '',
                    keepLooking = true;
                while (nodeValue === '' && keepLooking) {
                    rowIndex++;
                    if (rows[rowIndex]) {
                        node = rows[rowIndex].cells[cellIndex];
                        nodeValue = ts.getElementText(c, node, cellIndex);
                        $node = $(node);
                        if (table.config.debug) {
                            log('Checking if value was empty on row ' + rowIndex + ', column: ' + cellIndex + ': "' + nodeValue + '"');
                        }
                    } else {
                        keepLooking = false;
                    }
                }
                while (--i >= 0) {
                    cur = ts.parsers[i];
                    // ignore the default text parser because it will always be true
                    if (cur && cur.id !== 'text' && cur.is && cur.is(nodeValue, table, node, $node)) {
                        return cur;
                    }
                }
                // nothing found, return the generic parser (text)
                return ts.getParserById('text');
            }

            function buildParserCache(table) {
                var c = table.config,
                    // update table bodies in case we start with an empty table
                    tb = c.$tbodies = c.$table.children('tbody:not(.' + c.cssInfoBlock + ')'),
                    rows, list, l, i, h, ch, np, p, e, time,
                    j = 0,
                    parsersDebug = '',
                    len = tb.length;
                if ( len === 0) {
                    return c.debug ? log('Warning: *Empty table!* Not building a parser cache') : '';
                } else if (c.debug) {
                    time = new Date();
                    log('Detecting parsers for each column');
                }
                list = {
                    extractors: [],
                    parsers: []
                };
                while (j < len) {
                    rows = tb[j].rows;
                    if (rows.length) {
                        l = c.columns; // rows[j].cells.length;
                        for (i = 0; i < l; i++) {
                            h = c.$headerIndexed[i];
                            // get column indexed table cell
                            ch = ts.getColumnData( table, c.headers, i );
                            // get column parser/extractor
                            e = ts.getParserById( ts.getData(h, ch, 'extractor') );
                            p = ts.getParserById( ts.getData(h, ch, 'sorter') );
                            np = ts.getData(h, ch, 'parser') === 'false';
                            // empty cells behaviour - keeping emptyToBottom for backwards compatibility
                            c.empties[i] = ( ts.getData(h, ch, 'empty') || c.emptyTo || (c.emptyToBottom ? 'bottom' : 'top' ) ).toLowerCase();
                            // text strings behaviour in numerical sorts
                            c.strings[i] = ( ts.getData(h, ch, 'string') || c.stringTo || 'max' ).toLowerCase();
                            if (np) {
                                p = ts.getParserById('no-parser');
                            }
                            if (!e) {
                                // For now, maybe detect someday
                                e = false;
                            }
                            if (!p) {
                                p = detectParserForColumn(table, rows, -1, i);
                            }
                            if (c.debug) {
                                parsersDebug += 'column:' + i + '; extractor:' + e.id + '; parser:' + p.id + '; string:' + c.strings[i] + '; empty: ' + c.empties[i] + '\n';
                            }
                            list.parsers[i] = p;
                            list.extractors[i] = e;
                        }
                    }
                    j += (list.parsers.length) ? len : 1;
                }
                if (c.debug) {
                    log(parsersDebug ? parsersDebug : 'No parsers detected');
                    benchmark('Completed detecting parsers', time);
                }
                c.parsers = list.parsers;
                c.extractors = list.extractors;
            }

            /* utils */
            function buildCache(table) {
                var cc, t, tx, v, i, j, k, $row, cols, cacheTime,
                    totalRows, rowData, colMax,
                    c = table.config,
                    $tb = c.$tbodies,
                    extractors = c.extractors,
                    parsers = c.parsers;
                c.cache = {};
                c.totalRows = 0;
                // if no parsers found, return - it's an empty table.
                if (!parsers) {
                    return c.debug ? log('Warning: *Empty table!* Not building a cache') : '';
                }
                if (c.debug) {
                    cacheTime = new Date();
                }
                // processing icon
                if (c.showProcessing) {
                    ts.isProcessing(table, true);
                }
                for (k = 0; k < $tb.length; k++) {
                    colMax = []; // column max value per tbody
                    cc = c.cache[k] = {
                        normalized: [] // array of normalized row data; last entry contains 'rowData' above
                        // colMax: #   // added at the end
                    };

                    totalRows = ($tb[k] && $tb[k].rows.length) || 0;
                    for (i = 0; i < totalRows; ++i) {
                        rowData = {
                            // order: original row order #
                            // $row : jQuery Object[]
                            child: [], // child row text (filter widget)
                            raw: []    // original row text
                        };
                        /** Add the table data to main data array */
                        $row = $($tb[k].rows[i]);
                        cols = [];
                        // if this is a child row, add it to the last row's children and continue to the next row
                        // ignore child row class, if it is the first row
                        if ($row.hasClass(c.cssChildRow) && i !== 0) {
                            t = cc.normalized.length - 1;
                            cc.normalized[t][c.columns].$row = cc.normalized[t][c.columns].$row.add($row);
                            // add 'hasChild' class name to parent row
                            if (!$row.prev().hasClass(c.cssChildRow)) {
                                $row.prev().addClass(ts.css.cssHasChild);
                            }
                            // save child row content (un-parsed!)
                            rowData.child[t] = $.trim( $row[0].textContent || $row.text() || '' );
                            // go to the next for loop
                            continue;
                        }
                        rowData.$row = $row;
                        rowData.order = i; // add original row position to rowCache
                        for (j = 0; j < c.columns; ++j) {
                            if (typeof parsers[j] === 'undefined') {
                                if (c.debug) {
                                    log('No parser found for cell:', $row[0].cells[j], 'does it have a header?');
                                }
                                continue;
                            }
                            t = ts.getElementText(c, $row[0].cells[j], j);
                            rowData.raw.push(t); // save original row text
                            // do extract before parsing if there is one
                            if (typeof extractors[j].id === 'undefined') {
                                tx = t;
                            } else {
                                tx = extractors[j].format(t, table, $row[0].cells[j], j);
                            }
                            // allow parsing if the string is empty, previously parsing would change it to zero,
                            // in case the parser needs to extract data from the table cell attributes
                            v = parsers[j].id === 'no-parser' ? '' : parsers[j].format(tx, table, $row[0].cells[j], j);
                            cols.push( c.ignoreCase && typeof v === 'string' ? v.toLowerCase() : v );
                            if ((parsers[j].type || '').toLowerCase() === 'numeric') {
                                // determine column max value (ignore sign)
                                colMax[j] = Math.max(Math.abs(v) || 0, colMax[j] || 0);
                            }
                        }
                        // ensure rowData is always in the same location (after the last column)
                        cols[c.columns] = rowData;
                        cc.normalized.push(cols);
                    }
                    cc.colMax = colMax;
                    // total up rows, not including child rows
                    c.totalRows += cc.normalized.length;

                }
                if (c.showProcessing) {
                    ts.isProcessing(table); // remove processing icon
                }
                if (c.debug) {
                    benchmark('Building cache for ' + totalRows + ' rows', cacheTime);
                }
            }

            // init flag (true) used by pager plugin to prevent widget application
            function appendToTable(table, init) {
                var c = table.config,
                    wo = c.widgetOptions,
                    $tbodies = c.$tbodies,
                    rows = [],
                    cc = c.cache,
                    n, totalRows, $bk, $tb,
                    i, k, appendTime;
                // empty table - fixes #206/#346
                if (isEmptyObject(cc)) {
                    // run pager appender in case the table was just emptied
                    return c.appender ? c.appender(table, rows) :
                        table.isUpdating ? c.$table.trigger('updateComplete', table) : ''; // Fixes #532
                }
                if (c.debug) {
                    appendTime = new Date();
                }
                for (k = 0; k < $tbodies.length; k++) {
                    $bk = $tbodies.eq(k);
                    if ($bk.length) {
                        // get tbody
                        $tb = ts.processTbody(table, $bk, true);
                        n = cc[k].normalized;
                        totalRows = n.length;
                        for (i = 0; i < totalRows; i++) {
                            rows.push(n[i][c.columns].$row);
                            // removeRows used by the pager plugin; don't render if using ajax - fixes #411
                            if (!c.appender || (c.pager && (!c.pager.removeRows || !wo.pager_removeRows) && !c.pager.ajax)) {
                                $tb.append(n[i][c.columns].$row);
                            }
                        }
                        // restore tbody
                        ts.processTbody(table, $tb, false);
                    }
                }
                if (c.appender) {
                    c.appender(table, rows);
                }
                if (c.debug) {
                    benchmark('Rebuilt table', appendTime);
                }
                // apply table widgets; but not before ajax completes
                if (!init && !c.appender) { ts.applyWidget(table); }
                if (table.isUpdating) {
                    c.$table.trigger('updateComplete', table);
                }
            }

            function formatSortingOrder(v) {
                // look for 'd' in 'desc' order; return true
                return (/^d/i.test(v) || v === 1);
            }

            function buildHeaders(table) {
                var ch, $t, h, i, t, lock, time, indx,
                    c = table.config;
                c.headerList = [];
                c.headerContent = [];
                if (c.debug) {
                    time = new Date();
                }
                // children tr in tfoot - see issue #196 & #547
                c.columns = ts.computeColumnIndex( c.$table.children('thead, tfoot').children('tr') );
                // add icon if cssIcon option exists
                i = c.cssIcon ? '<i class="' + ( c.cssIcon === ts.css.icon ? ts.css.icon : c.cssIcon + ' ' + ts.css.icon ) + '"></i>' : '';
                // redefine c.$headers here in case of an updateAll that replaces or adds an entire header cell - see #683
                c.$headers = $( $.map( $(table).find(c.selectorHeaders), function(elem, index) {
                    $t = $(elem);
                    // ignore cell (don't add it to c.$headers) if row has ignoreRow class
                    if ($t.parent().hasClass(c.cssIgnoreRow)) { return; }
                    // make sure to get header cell & not column indexed cell
                    ch = ts.getColumnData( table, c.headers, index, true );
                    // save original header content
                    c.headerContent[index] = $t.html();
                    // if headerTemplate is empty, don't reformat the header cell
                    if ( c.headerTemplate !== '' && !$t.find('.' + ts.css.headerIn).length ) {
                        // set up header template
                        t = c.headerTemplate.replace(/\{content\}/g, $t.html()).replace(/\{icon\}/g, $t.find('.' + ts.css.icon).length ? '' : i);
                        if (c.onRenderTemplate) {
                            h = c.onRenderTemplate.apply($t, [index, t]);
                            if (h && typeof h === 'string') { t = h; } // only change t if something is returned
                        }
                        $t.html('<div class="' + ts.css.headerIn + '">' + t + '</div>'); // faster than wrapInner
                    }
                    if (c.onRenderHeader) { c.onRenderHeader.apply($t, [index, c, c.$table]); }
                    // *** remove this.column value if no conflicts found
                    elem.column = parseInt( $t.attr('data-column'), 10);
                    elem.order = formatSortingOrder( ts.getData($t, ch, 'sortInitialOrder') || c.sortInitialOrder ) ? [1,0,2] : [0,1,2];
                    elem.count = -1; // set to -1 because clicking on the header automatically adds one
                    elem.lockedOrder = false;
                    lock = ts.getData($t, ch, 'lockedOrder') || false;
                    if (typeof lock !== 'undefined' && lock !== false) {
                        elem.order = elem.lockedOrder = formatSortingOrder(lock) ? [1,1,1] : [0,0,0];
                    }
                    $t.addClass(ts.css.header + ' ' + c.cssHeader);
                    // add cell to headerList
                    c.headerList[index] = elem;
                    // add to parent in case there are multiple rows
                    $t.parent().addClass(ts.css.headerRow + ' ' + c.cssHeaderRow).attr('role', 'row');
                    // allow keyboard cursor to focus on element
                    if (c.tabIndex) { $t.attr('tabindex', 0); }
                    return elem;
                }));
                // cache headers per column
                c.$headerIndexed = [];
                for (indx = 0; indx < c.columns; indx++) {
                    $t = c.$headers.filter('[data-column="' + indx + '"]');
                    // target sortable column cells, unless there are none, then use non-sortable cells
                    // .last() added in jQuery 1.4; use .filter(':last') to maintain compatibility with jQuery v1.2.6
                    c.$headerIndexed[indx] = $t.not('.sorter-false').length ? $t.not('.sorter-false').filter(':last') : $t.filter(':last');
                }
                $(table).find(c.selectorHeaders).attr({
                    scope: 'col',
                    role : 'columnheader'
                });
                // enable/disable sorting
                updateHeader(table);
                if (c.debug) {
                    benchmark('Built headers:', time);
                    log(c.$headers);
                }
            }

            function commonUpdate(table, resort, callback) {
                var c = table.config;
                // remove rows/elements before update
                c.$table.find(c.selectorRemove).remove();
                // rebuild parsers
                buildParserCache(table);
                // rebuild the cache map
                buildCache(table);
                checkResort(c, resort, callback);
            }

            function updateHeader(table) {
                var s, $th, col,
                    c = table.config;
                c.$headers.each(function(index, th){
                    $th = $(th);
                    col = ts.getColumnData( table, c.headers, index, true );
                    // add 'sorter-false' class if 'parser-false' is set
                    s = ts.getData( th, col, 'sorter' ) === 'false' || ts.getData( th, col, 'parser' ) === 'false';
                    th.sortDisabled = s;
                    $th[ s ? 'addClass' : 'removeClass' ]('sorter-false').attr('aria-disabled', '' + s);
                    // aria-controls - requires table ID
                    if (table.id) {
                        if (s) {
                            $th.removeAttr('aria-controls');
                        } else {
                            $th.attr('aria-controls', table.id);
                        }
                    }
                });
            }

            function setHeadersCss(table) {
                var f, i, j,
                    c = table.config,
                    list = c.sortList,
                    len = list.length,
                    none = ts.css.sortNone + ' ' + c.cssNone,
                    css = [ts.css.sortAsc + ' ' + c.cssAsc, ts.css.sortDesc + ' ' + c.cssDesc],
                    cssIcon = [ c.cssIconAsc, c.cssIconDesc, c.cssIconNone ],
                    aria = ['ascending', 'descending'],
                    // find the footer
                    $t = $(table).find('tfoot tr').children()
                        .add( $( c.namespace + '_extra_headers' ) )
                        .removeClass( css.join( ' ' ) );
                // remove all header information
                c.$headers
                    .removeClass(css.join(' '))
                    .addClass(none).attr('aria-sort', 'none')
                    .find('.' + ts.css.icon)
                    .removeClass(cssIcon.join(' '))
                    .addClass(cssIcon[2]);
                for (i = 0; i < len; i++) {
                    // direction = 2 means reset!
                    if (list[i][1] !== 2) {
                        // multicolumn sorting updating - choose the :last in case there are nested columns
                        f = c.$headers.not('.sorter-false').filter('[data-column="' + list[i][0] + '"]' + (len === 1 ? ':last' : '') );
                        if (f.length) {
                            for (j = 0; j < f.length; j++) {
                                if (!f[j].sortDisabled) {
                                    f.eq(j)
                                        .removeClass(none)
                                        .addClass(css[list[i][1]])
                                        .attr('aria-sort', aria[list[i][1]])
                                        .find('.' + ts.css.icon)
                                        .removeClass(cssIcon[2])
                                        .addClass(cssIcon[list[i][1]]);
                                }
                            }
                            // add sorted class to footer & extra headers, if they exist
                            if ($t.length) {
                                $t.filter('[data-column="' + list[i][0] + '"]').removeClass(none).addClass(css[list[i][1]]);
                            }
                        }
                    }
                }
                // add verbose aria labels
                c.$headers.not('.sorter-false').each(function(){
                    var $this = $(this),
                        nextSort = this.order[(this.count + 1) % (c.sortReset ? 3 : 2)],
                        txt = $.trim( $this.text() ) + ': ' +
                            ts.language[ $this.hasClass(ts.css.sortAsc) ? 'sortAsc' : $this.hasClass(ts.css.sortDesc) ? 'sortDesc' : 'sortNone' ] +
                            ts.language[ nextSort === 0 ? 'nextAsc' : nextSort === 1 ? 'nextDesc' : 'nextNone' ];
                    $this.attr('aria-label', txt );
                });
            }

            function updateHeaderSortCount( table, list ) {
                var col, dir, group, header, indx, primary, temp, val,
                    c = table.config,
                    sortList = list || c.sortList,
                    len = sortList.length;
                c.sortList = [];
                for (indx = 0; indx < len; indx++) {
                    val = sortList[indx];
                    // ensure all sortList values are numeric - fixes #127
                    col = parseInt(val[0], 10);
                    // make sure header exists
                    header = c.$headerIndexed[col][0];
                    if (header) { // prevents error if sorton array is wrong
                        // o.count = o.count + 1;
                        dir = ('' + val[1]).match(/^(1|d|s|o|n)/);
                        dir = dir ? dir[0] : '';
                        // 0/(a)sc (default), 1/(d)esc, (s)ame, (o)pposite, (n)ext
                        switch(dir) {
                            case '1': case 'd': // descending
                                dir = 1;
                                break;
                            case 's': // same direction (as primary column)
                                // if primary sort is set to 's', make it ascending
                                dir = primary || 0;
                                break;
                            case 'o':
                                temp = header.order[(primary || 0) % (c.sortReset ? 3 : 2)];
                                // opposite of primary column; but resets if primary resets
                                dir = temp === 0 ? 1 : temp === 1 ? 0 : 2;
                                break;
                            case 'n':
                                header.count = header.count + 1;
                                dir = header.order[(header.count) % (c.sortReset ? 3 : 2)];
                                break;
                            default: // ascending
                                dir = 0;
                                break;
                        }
                        primary = indx === 0 ? dir : primary;
                        group = [ col, parseInt(dir, 10) || 0 ];
                        c.sortList.push(group);
                        dir = $.inArray(group[1], header.order); // fixes issue #167
                        header.count = dir >= 0 ? dir : group[1] % (c.sortReset ? 3 : 2);
                    }
                }
            }

            function getCachedSortType(parsers, i) {
                return (parsers && parsers[i]) ? parsers[i].type || '' : '';
            }

            function initSort(table, cell, event){
                if (table.isUpdating) {
                    // let any updates complete before initializing a sort
                    return setTimeout(function(){ initSort(table, cell, event); }, 50);
                }
                var arry, indx, col, order, s,
                    c = table.config,
                    key = !event[c.sortMultiSortKey],
                    $table = c.$table;
                // Only call sortStart if sorting is enabled
                $table.trigger('sortStart', table);
                // get current column sort order
                cell.count = event[c.sortResetKey] ? 2 : (cell.count + 1) % (c.sortReset ? 3 : 2);
                // reset all sorts on non-current column - issue #30
                if (c.sortRestart) {
                    indx = cell;
                    c.$headers.each(function() {
                        // only reset counts on columns that weren't just clicked on and if not included in a multisort
                        if (this !== indx && (key || !$(this).is('.' + ts.css.sortDesc + ',.' + ts.css.sortAsc))) {
                            this.count = -1;
                        }
                    });
                }
                // get current column index
                indx = parseInt( $(cell).attr('data-column'), 10 );
                // user only wants to sort on one column
                if (key) {
                    // flush the sort list
                    c.sortList = [];
                    if (c.sortForce !== null) {
                        arry = c.sortForce;
                        for (col = 0; col < arry.length; col++) {
                            if (arry[col][0] !== indx) {
                                c.sortList.push(arry[col]);
                            }
                        }
                    }
                    // add column to sort list
                    order = cell.order[cell.count];
                    if (order < 2) {
                        c.sortList.push([indx, order]);
                        // add other columns if header spans across multiple
                        if (cell.colSpan > 1) {
                            for (col = 1; col < cell.colSpan; col++) {
                                c.sortList.push([indx + col, order]);
                            }
                        }
                    }
                    // multi column sorting
                } else {
                    // get rid of the sortAppend before adding more - fixes issue #115 & #523
                    if (c.sortAppend && c.sortList.length > 1) {
                        for (col = 0; col < c.sortAppend.length; col++) {
                            s = ts.isValueInArray(c.sortAppend[col][0], c.sortList);
                            if (s >= 0) {
                                c.sortList.splice(s,1);
                            }
                        }
                    }
                    // the user has clicked on an already sorted column
                    if (ts.isValueInArray(indx, c.sortList) >= 0) {
                        // reverse the sorting direction
                        for (col = 0; col < c.sortList.length; col++) {
                            s = c.sortList[col];
                            order = c.$headerIndexed[ s[0] ][0];
                            if (s[0] === indx) {
                                // order.count seems to be incorrect when compared to cell.count
                                s[1] = order.order[cell.count];
                                if (s[1] === 2) {
                                    c.sortList.splice(col,1);
                                    order.count = -1;
                                }
                            }
                        }
                    } else {
                        // add column to sort list array
                        order = cell.order[cell.count];
                        if (order < 2) {
                            c.sortList.push([indx, order]);
                            // add other columns if header spans across multiple
                            if (cell.colSpan > 1) {
                                for (col = 1; col < cell.colSpan; col++) {
                                    c.sortList.push([indx + col, order]);
                                }
                            }
                        }
                    }
                }
                if (c.sortAppend !== null) {
                    arry = c.sortAppend;
                    for (col = 0; col < arry.length; col++) {
                        if (arry[col][0] !== indx) {
                            c.sortList.push(arry[col]);
                        }
                    }
                }
                // sortBegin event triggered immediately before the sort
                $table.trigger('sortBegin', table);
                // setTimeout needed so the processing icon shows up
                setTimeout(function(){
                    // set css for headers
                    setHeadersCss(table);
                    multisort(table);
                    appendToTable(table);
                    $table.trigger('sortEnd', table);
                }, 1);
            }

            // sort multiple columns
            function multisort(table) { /*jshint loopfunc:true */
                var i, k, num, col, sortTime, colMax,
                    rows, order, sort, x, y,
                    dir = 0,
                    c = table.config,
                    cts = c.textSorter || '',
                    sortList = c.sortList,
                    l = sortList.length,
                    bl = c.$tbodies.length;
                if (c.serverSideSorting || isEmptyObject(c.cache)) { // empty table - fixes #206/#346
                    return;
                }
                if (c.debug) { sortTime = new Date(); }
                for (k = 0; k < bl; k++) {
                    colMax = c.cache[k].colMax;
                    rows = c.cache[k].normalized;

                    rows.sort(function(a, b) {
                        // rows is undefined here in IE, so don't use it!
                        for (i = 0; i < l; i++) {
                            col = sortList[i][0];
                            order = sortList[i][1];
                            // sort direction, true = asc, false = desc
                            dir = order === 0;

                            if (c.sortStable && a[col] === b[col] && l === 1) {
                                return a[c.columns].order - b[c.columns].order;
                            }

                            // fallback to natural sort since it is more robust
                            num = /n/i.test(getCachedSortType(c.parsers, col));
                            if (num && c.strings[col]) {
                                // sort strings in numerical columns
                                if (typeof (c.string[c.strings[col]]) === 'boolean') {
                                    num = (dir ? 1 : -1) * (c.string[c.strings[col]] ? -1 : 1);
                                } else {
                                    num = (c.strings[col]) ? c.string[c.strings[col]] || 0 : 0;
                                }
                                // fall back to built-in numeric sort
                                // var sort = $.tablesorter['sort' + s](table, a[c], b[c], c, colMax[c], dir);
                                sort = c.numberSorter ? c.numberSorter(a[col], b[col], dir, colMax[col], table) :
                                    ts[ 'sortNumeric' + (dir ? 'Asc' : 'Desc') ](a[col], b[col], num, colMax[col], col, table);
                            } else {
                                // set a & b depending on sort direction
                                x = dir ? a : b;
                                y = dir ? b : a;
                                // text sort function
                                if (typeof(cts) === 'function') {
                                    // custom OVERALL text sorter
                                    sort = cts(x[col], y[col], dir, col, table);
                                } else if (typeof(cts) === 'object' && cts.hasOwnProperty(col)) {
                                    // custom text sorter for a SPECIFIC COLUMN
                                    sort = cts[col](x[col], y[col], dir, col, table);
                                } else {
                                    // fall back to natural sort
                                    sort = ts[ 'sortNatural' + (dir ? 'Asc' : 'Desc') ](a[col], b[col], col, table, c);
                                }
                            }
                            if (sort) { return sort; }
                        }
                        return a[c.columns].order - b[c.columns].order;
                    });
                }
                if (c.debug) { benchmark('Sorting on ' + sortList.toString() + ' and dir ' + order + ' time', sortTime); }
            }

            function resortComplete(c, callback){
                if (c.table.isUpdating) {
                    c.$table.trigger('updateComplete', c.table);
                }
                if ($.isFunction(callback)) {
                    callback(c.table);
                }
            }

            function checkResort(c, resort, callback) {
                var sl = $.isArray(resort) ? resort : c.sortList,
                    // if no resort parameter is passed, fallback to config.resort (true by default)
                    resrt = typeof resort === 'undefined' ? c.resort : resort;
                // don't try to resort if the table is still processing
                // this will catch spamming of the updateCell method
                if (resrt !== false && !c.serverSideSorting && !c.table.isProcessing) {
                    if (sl.length) {
                        c.$table.trigger('sorton', [sl, function(){
                            resortComplete(c, callback);
                        }, true]);
                    } else {
                        c.$table.trigger('sortReset', [function(){
                            resortComplete(c, callback);
                            ts.applyWidget(c.table, false);
                        }]);
                    }
                } else {
                    resortComplete(c, callback);
                    ts.applyWidget(c.table, false);
                }
            }

            function bindMethods(table){
                var c = table.config,
                    $table = c.$table,
                    events = ('sortReset update updateRows updateCell updateAll addRows updateComplete sorton appendCache ' +
                        'updateCache applyWidgetId applyWidgets refreshWidgets destroy mouseup mouseleave ').split(' ')
                        .join(c.namespace + ' ');
                // apply easy methods that trigger bound events
                $table
                .unbind( events.replace(/\s+/g, ' ') )
                .bind('sortReset' + c.namespace, function(e, callback){
                    e.stopPropagation();
                    c.sortList = [];
                    setHeadersCss(table);
                    multisort(table);
                    appendToTable(table);
                    if ($.isFunction(callback)) {
                        callback(table);
                    }
                })
                .bind('updateAll' + c.namespace, function(e, resort, callback){
                    e.stopPropagation();
                    table.isUpdating = true;
                    ts.refreshWidgets(table, true, true);
                    buildHeaders(table);
                    ts.bindEvents(table, c.$headers, true);
                    bindMethods(table);
                    commonUpdate(table, resort, callback);
                })
                .bind('update' + c.namespace + ' updateRows' + c.namespace, function(e, resort, callback) {
                    e.stopPropagation();
                    table.isUpdating = true;
                    // update sorting (if enabled/disabled)
                    updateHeader(table);
                    commonUpdate(table, resort, callback);
                })
                .bind('updateCell' + c.namespace, function(e, cell, resort, callback) {
                    e.stopPropagation();
                    table.isUpdating = true;
                    $table.find(c.selectorRemove).remove();
                    // get position from the dom
                    var v, t, row, icell,
                    $tb = c.$tbodies,
                    $cell = $(cell),
                    // update cache - format: function(s, table, cell, cellIndex)
                    // no closest in jQuery v1.2.6 - tbdy = $tb.index( $(cell).closest('tbody') ),$row = $(cell).closest('tr');
                    tbdy = $tb.index( $.fn.closest ? $cell.closest('tbody') : $cell.parents('tbody').filter(':first') ),
                    $row = $.fn.closest ? $cell.closest('tr') : $cell.parents('tr').filter(':first');
                    cell = $cell[0]; // in case cell is a jQuery object
                    // tbody may not exist if update is initialized while tbody is removed for processing
                    if ($tb.length && tbdy >= 0) {
                        row = $tb.eq(tbdy).find('tr').index( $row );
                        icell = $cell.index();
                        c.cache[tbdy].normalized[row][c.columns].$row = $row;
                        if (typeof c.extractors[icell].id === 'undefined') {
                            t = ts.getElementText(c, cell, icell);
                        } else {
                            t = c.extractors[icell].format( ts.getElementText(c, cell, icell), table, cell, icell );
                        }
                        v = c.parsers[icell].id === 'no-parser' ? '' :
                            c.parsers[icell].format( t, table, cell, icell );
                        c.cache[tbdy].normalized[row][icell] = c.ignoreCase && typeof v === 'string' ? v.toLowerCase() : v;
                        if ((c.parsers[icell].type || '').toLowerCase() === 'numeric') {
                            // update column max value (ignore sign)
                            c.cache[tbdy].colMax[icell] = Math.max(Math.abs(v) || 0, c.cache[tbdy].colMax[icell] || 0);
                        }
                        v = resort !== 'undefined' ? resort : c.resort;
                        if (v !== false) {
                            // widgets will be reapplied
                            checkResort(c, v, callback);
                        } else {
                            // don't reapply widgets is resort is false, just in case it causes
                            // problems with element focus
                            if ($.isFunction(callback)) {
                                callback(table);
                            }
                            c.$table.trigger('updateComplete', c.table);
                        }
                    }
                })
                .bind('addRows' + c.namespace, function(e, $row, resort, callback) {
                    e.stopPropagation();
                    table.isUpdating = true;
                    if (isEmptyObject(c.cache)) {
                        // empty table, do an update instead - fixes #450
                        updateHeader(table);
                        commonUpdate(table, resort, callback);
                    } else {
                        $row = $($row).attr('role', 'row'); // make sure we're using a jQuery object
                        var i, j, l, t, v, rowData, cells,
                        rows = $row.filter('tr').length,
                        tbdy = c.$tbodies.index( $row.parents('tbody').filter(':first') );
                        // fixes adding rows to an empty table - see issue #179
                        if (!(c.parsers && c.parsers.length)) {
                            buildParserCache(table);
                        }
                        // add each row
                        for (i = 0; i < rows; i++) {
                            l = $row[i].cells.length;
                            cells = [];
                            rowData = {
                                child: [],
                                $row : $row.eq(i),
                                order: c.cache[tbdy].normalized.length
                            };
                            // add each cell
                            for (j = 0; j < l; j++) {
                                if (typeof c.extractors[j].id === 'undefined') {
                                    t = ts.getElementText(c, $row[i].cells[j], j);
                                } else {
                                    t = c.extractors[j].format( ts.getElementText(c, $row[i].cells[j], j), table, $row[i].cells[j], j );
                                }
                                v = c.parsers[j].id === 'no-parser' ? '' :
                                    c.parsers[j].format( t, table, $row[i].cells[j], j );
                                cells[j] = c.ignoreCase && typeof v === 'string' ? v.toLowerCase() : v;
                                if ((c.parsers[j].type || '').toLowerCase() === 'numeric') {
                                    // update column max value (ignore sign)
                                    c.cache[tbdy].colMax[j] = Math.max(Math.abs(cells[j]) || 0, c.cache[tbdy].colMax[j] || 0);
                                }
                            }
                            // add the row data to the end
                            cells.push(rowData);
                            // update cache
                            c.cache[tbdy].normalized.push(cells);
                        }
                        // resort using current settings
                        checkResort(c, resort, callback);
                    }
                })
                .bind('updateComplete' + c.namespace, function(){
                    table.isUpdating = false;
                })
                .bind('sorton' + c.namespace, function(e, list, callback, init) {
                    var c = table.config;
                    e.stopPropagation();
                    $table.trigger('sortStart', this);
                    // update header count index
                    updateHeaderSortCount(table, list);
                    // set css for headers
                    setHeadersCss(table);
                    // fixes #346
                    if (c.delayInit && isEmptyObject(c.cache)) { buildCache(table); }
                    $table.trigger('sortBegin', this);
                    // sort the table and append it to the dom
                    multisort(table);
                    appendToTable(table, init);
                    $table.trigger('sortEnd', this);
                    ts.applyWidget(table);
                    if ($.isFunction(callback)) {
                        callback(table);
                    }
                })
                .bind('appendCache' + c.namespace, function(e, callback, init) {
                    e.stopPropagation();
                    appendToTable(table, init);
                    if ($.isFunction(callback)) {
                        callback(table);
                    }
                })
                .bind('updateCache' + c.namespace, function(e, callback){
                    // rebuild parsers
                    if (!(c.parsers && c.parsers.length)) {
                        buildParserCache(table);
                    }
                    // rebuild the cache map
                    buildCache(table);
                    if ($.isFunction(callback)) {
                        callback(table);
                    }
                })
                .bind('applyWidgetId' + c.namespace, function(e, id) {
                    e.stopPropagation();
                    ts.getWidgetById(id).format(table, c, c.widgetOptions);
                })
                .bind('applyWidgets' + c.namespace, function(e, init) {
                    e.stopPropagation();
                    // apply widgets
                    ts.applyWidget(table, init);
                })
                .bind('refreshWidgets' + c.namespace, function(e, all, dontapply){
                    e.stopPropagation();
                    ts.refreshWidgets(table, all, dontapply);
                })
                .bind('destroy' + c.namespace, function(e, c, cb){
                    e.stopPropagation();
                    ts.destroy(table, c, cb);
                })
                .bind('resetToLoadState' + c.namespace, function(){
                    // remove all widgets
                    ts.removeWidget(table, true, false);
                    // restore original settings; this clears out current settings, but does not clear
                    // values saved to storage.
                    c = $.extend(true, ts.defaults, c.originalSettings);
                    table.hasInitialized = false;
                    // setup the entire table again
                    ts.setup( table, c );
                });
            }

            /* public methods */
            ts.construct = function(settings) {
                return this.each(function() {
                    var table = this,
                        // merge & extend config options
                        c = $.extend(true, {}, ts.defaults, settings, ts.instanceMethods);
                        // save initial settings
                        c.originalSettings = settings;
                    // create a table from data (build table widget)
                    if (!table.hasInitialized && ts.buildTable && this.nodeName !== 'TABLE') {
                        // return the table (in case the original target is the table's container)
                        ts.buildTable(table, c);
                    } else {
                        ts.setup(table, c);
                    }
                });
            };

            ts.setup = function(table, c) {
                // if no thead or tbody, or tablesorter is already present, quit
                if (!table || !table.tHead || table.tBodies.length === 0 || table.hasInitialized === true) {
                    return c.debug ? log('ERROR: stopping initialization! No table, thead, tbody or tablesorter has already been initialized') : '';
                }

                var k = '',
                    $table = $(table),
                    m = $.metadata;
                // initialization flag
                table.hasInitialized = false;
                // table is being processed flag
                table.isProcessing = true;
                // make sure to store the config object
                table.config = c;
                // save the settings where they read
                $.data(table, 'tablesorter', c);
                if (c.debug) { $.data( table, 'startoveralltimer', new Date()); }

                // removing this in version 3 (only supports jQuery 1.7+)
                c.supportsDataObject = (function(version) {
                    version[0] = parseInt(version[0], 10);
                    return (version[0] > 1) || (version[0] === 1 && parseInt(version[1], 10) >= 4);
                })($.fn.jquery.split('.'));
                // digit sort text location; keeping max+/- for backwards compatibility
                c.string = { 'max': 1, 'min': -1, 'emptymin': 1, 'emptymax': -1, 'zero': 0, 'none': 0, 'null': 0, 'top': true, 'bottom': false };
                // ensure case insensitivity
                c.emptyTo = c.emptyTo.toLowerCase();
                c.stringTo = c.stringTo.toLowerCase();
                // add table theme class only if there isn't already one there
                if (!/tablesorter\-/.test($table.attr('class'))) {
                    k = (c.theme !== '' ? ' tablesorter-' + c.theme : '');
                }
                c.table = table;
                c.$table = $table
                    .addClass(ts.css.table + ' ' + c.tableClass + k)
                    .attr('role', 'grid');
                c.$headers = $table.find(c.selectorHeaders);

                // give the table a unique id, which will be used in namespace binding
                if (!c.namespace) {
                    c.namespace = '.tablesorter' + Math.random().toString(16).slice(2);
                } else {
                    // make sure namespace starts with a period & doesn't have weird characters
                    c.namespace = '.' + c.namespace.replace(/\W/g,'');
                }

                c.$table.children().children('tr').attr('role', 'row');
                c.$tbodies = $table.children('tbody:not(.' + c.cssInfoBlock + ')').attr({
                    'aria-live' : 'polite',
                    'aria-relevant' : 'all'
                });
                if (c.$table.children('caption').length) {
                    k = c.$table.children('caption')[0];
                    if (!k.id) { k.id = c.namespace.slice(1) + 'caption'; }
                    c.$table.attr('aria-labelledby', k.id);
                }
                c.widgetInit = {}; // keep a list of initialized widgets
                // change textExtraction via data-attribute
                c.textExtraction = c.$table.attr('data-text-extraction') || c.textExtraction || 'basic';
                // build headers
                buildHeaders(table);
                // fixate columns if the users supplies the fixedWidth option
                // do this after theme has been applied
                ts.fixColumnWidth(table);
                // add widget options before parsing (e.g. grouping widget has parser settings)
                ts.applyWidgetOptions(table, c);
                // try to auto detect column type, and store in tables config
                buildParserCache(table);
                // start total row count at zero
                c.totalRows = 0;
                // build the cache for the tbody cells
                // delayInit will delay building the cache until the user starts a sort
                if (!c.delayInit) { buildCache(table); }
                // bind all header events and methods
                ts.bindEvents(table, c.$headers, true);
                bindMethods(table);
                // get sort list from jQuery data or metadata
                // in jQuery < 1.4, an error occurs when calling $table.data()
                if (c.supportsDataObject && typeof $table.data().sortlist !== 'undefined') {
                    c.sortList = $table.data().sortlist;
                } else if (m && ($table.metadata() && $table.metadata().sortlist)) {
                    c.sortList = $table.metadata().sortlist;
                }
                // apply widget init code
                ts.applyWidget(table, true);
                // if user has supplied a sort list to constructor
                if (c.sortList.length > 0) {
                    $table.trigger('sorton', [c.sortList, {}, !c.initWidgets, true]);
                } else {
                    setHeadersCss(table);
                    if (c.initWidgets) {
                        // apply widget format
                        ts.applyWidget(table, false);
                    }
                }

                // show processesing icon
                if (c.showProcessing) {
                    $table
                    .unbind('sortBegin' + c.namespace + ' sortEnd' + c.namespace)
                    .bind('sortBegin' + c.namespace + ' sortEnd' + c.namespace, function(e) {
                        clearTimeout(c.processTimer);
                        ts.isProcessing(table);
                        if (e.type === 'sortBegin') {
                            c.processTimer = setTimeout(function(){
                                ts.isProcessing(table, true);
                            }, 500);
                        }
                    });
                }

                // initialized
                table.hasInitialized = true;
                table.isProcessing = false;
                if (c.debug) {
                    ts.benchmark('Overall initialization time', $.data( table, 'startoveralltimer'));
                }
                $table.trigger('tablesorter-initialized', table);
                if (typeof c.initialized === 'function') { c.initialized(table); }
            };

            // automatically add a colgroup with col elements set to a percentage width
            ts.fixColumnWidth = function(table) {
                table = $(table)[0];
                var overallWidth, percent,
                    c = table.config,
                    colgroup = c.$table.children('colgroup');
                // remove plugin-added colgroup, in case we need to refresh the widths
                if (colgroup.length && colgroup.hasClass(ts.css.colgroup)) {
                    colgroup.remove();
                }
                if (c.widthFixed && c.$table.children('colgroup').length === 0) {
                    colgroup = $('<colgroup class="' + ts.css.colgroup + '">');
                    overallWidth = c.$table.width();
                    // only add col for visible columns - fixes #371
                    c.$tbodies.find('tr:first').children(':visible').each(function() {
                        percent = parseInt( ( $(this).width() / overallWidth ) * 1000, 10 ) / 10 + '%';
                        colgroup.append( $('<col>').css('width', percent) );
                    });
                    c.$table.prepend(colgroup);
                }
            };

            ts.getColumnData = function(table, obj, indx, getCell, $headers){
                if (typeof obj === 'undefined' || obj === null) { return; }
                table = $(table)[0];
                var $h, k,
                    c = table.config,
                    $cells = ( $headers || c.$headers ),
                    // c.$headerIndexed is not defined initially
                    $cell = c.$headerIndexed && c.$headerIndexed[indx] || $cells.filter('[data-column="' + indx + '"]:last');
                if (obj[indx]) {
                    return getCell ? obj[indx] : obj[$cells.index( $cell )];
                }
                for (k in obj) {
                    if (typeof k === 'string') {
                        $h = $cell
                            // header cell with class/id
                            .filter(k)
                            // find elements within the header cell with cell/id
                            .add( $cell.find(k) );
                        if ($h.length) {
                            return obj[k];
                        }
                    }
                }
                return;
            };

            // computeTableHeaderCellIndexes from:
            // http://www.javascripttoolbox.com/lib/table/examples.php
            // http://www.javascripttoolbox.com/temp/table_cellindex.html
            ts.computeColumnIndex = function(trs) {
                var matrix = [],
                lookup = {},
                i, j, k, l, $cell, cell, cells, rowIndex, cellId, rowSpan, colSpan, firstAvailCol, matrixrow;
                for (i = 0; i < trs.length; i++) {
                    cells = trs[i].cells;
                    for (j = 0; j < cells.length; j++) {
                        cell = cells[j];
                        $cell = $(cell);
                        rowIndex = cell.parentNode.rowIndex;
                        cellId = rowIndex + '-' + $cell.index();
                        rowSpan = cell.rowSpan || 1;
                        colSpan = cell.colSpan || 1;
                        if (typeof(matrix[rowIndex]) === 'undefined') {
                            matrix[rowIndex] = [];
                        }
                        // Find first available column in the first row
                        for (k = 0; k < matrix[rowIndex].length + 1; k++) {
                            if (typeof(matrix[rowIndex][k]) === 'undefined') {
                                firstAvailCol = k;
                                break;
                            }
                        }
                        lookup[cellId] = firstAvailCol;
                        // add data-column
                        $cell.attr({ 'data-column' : firstAvailCol }); // 'data-row' : rowIndex
                        for (k = rowIndex; k < rowIndex + rowSpan; k++) {
                            if (typeof(matrix[k]) === 'undefined') {
                                matrix[k] = [];
                            }
                            matrixrow = matrix[k];
                            for (l = firstAvailCol; l < firstAvailCol + colSpan; l++) {
                                matrixrow[l] = 'x';
                            }
                        }
                    }
                }
                return matrixrow.length;
            };

            // *** Process table ***
            // add processing indicator
            ts.isProcessing = function(table, toggle, $ths) {
                table = $(table);
                var c = table[0].config,
                    // default to all headers
                    $h = $ths || table.find('.' + ts.css.header);
                if (toggle) {
                    // don't use sortList if custom $ths used
                    if (typeof $ths !== 'undefined' && c.sortList.length > 0) {
                        // get headers from the sortList
                        $h = $h.filter(function(){
                            // get data-column from attr to keep  compatibility with jQuery 1.2.6
                            return this.sortDisabled ? false : ts.isValueInArray( parseFloat($(this).attr('data-column')), c.sortList) >= 0;
                        });
                    }
                    table.add($h).addClass(ts.css.processing + ' ' + c.cssProcessing);
                } else {
                    table.add($h).removeClass(ts.css.processing + ' ' + c.cssProcessing);
                }
            };

            // detach tbody but save the position
            // don't use tbody because there are portions that look for a tbody index (updateCell)
            ts.processTbody = function(table, $tb, getIt){
                table = $(table)[0];
                var holdr;
                if (getIt) {
                    table.isProcessing = true;
                    $tb.before('<span class="tablesorter-savemyplace"/>');
                    holdr = ($.fn.detach) ? $tb.detach() : $tb.remove();
                    return holdr;
                }
                holdr = $(table).find('span.tablesorter-savemyplace');
                $tb.insertAfter( holdr );
                holdr.remove();
                table.isProcessing = false;
            };

            ts.clearTableBody = function(table) {
                $(table)[0].config.$tbodies.children().detach();
            };

            ts.bindEvents = function(table, $headers, core){
                table = $(table)[0];
                var t, downTarget = null,
                    c = table.config;
                if (core !== true) {
                    $headers.addClass( c.namespace.slice(1) + '_extra_headers' );
                    t = $.fn.closest ? $headers.closest('table')[0] : $headers.parents('table')[0];
                    if (t && t.nodeName === 'TABLE' && t !== table) {
                        $(t).addClass( c.namespace.slice(1) + '_extra_table' );
                    }
                }
                // apply event handling to headers and/or additional headers (stickyheaders, scroller, etc)
                $headers
                // http://stackoverflow.com/questions/5312849/jquery-find-self;
                .find(c.selectorSort).add( $headers.filter(c.selectorSort) )
                .unbind( ('mousedown mouseup click sort keyup '.split(' ').join(c.namespace + ' ')).replace(/\s+/g, ' ') )
                .bind( 'mousedown mouseup click sort keyup '.split(' ').join(c.namespace + ' '), function(e, external) {
                    var cell,
                        $target = $(e.target),
                        type = e.type;
                    // only recognize left clicks
                    if ( ( ( e.which || e.button ) !== 1 && !/sort|keyup|click/.test(type) ) ||
                        // allow pressing enter
                        ( type === 'keyup' && e.which !== 13 ) ||
                        // allow triggering a click event (e.which is undefined) & ignore physical clicks
                        ( type === 'click' && typeof e.which !== 'undefined' ) ) {
                        return;
                    }
                    // ignore mouseup if mousedown wasn't on the same target
                    if ( type === 'mouseup' && downTarget !== e.target && external !== true ) { return; }
                    // set timer on mousedown
                    if ( type === 'mousedown' ) {
                        downTarget = e.target;
                        return;
                    }
                    downTarget = null;
                    // prevent sort being triggered on form elements
                    if ( /(input|select|button|textarea)/i.test(e.target.nodeName) ||
                        // nosort class name, or elements within a nosort container
                        $target.hasClass(c.cssNoSort) || $target.parents('.' + c.cssNoSort).length > 0 ||
                        // elements within a button
                        $target.parents('button').length > 0 ) {
                        return !c.cancelSelection;
                    }
                    if (c.delayInit && isEmptyObject(c.cache)) { buildCache(table); }
                    // jQuery v1.2.6 doesn't have closest()
                    cell = $.fn.closest ? $(this).closest('th, td')[0] : /TH|TD/.test(this.nodeName) ? this : $(this).parents('th, td')[0];
                    // reference original table headers and find the same cell
                    cell = c.$headers[ $headers.index( cell ) ];
                    if (!cell.sortDisabled) {
                        initSort(table, cell, e);
                    }
                });
                if (c.cancelSelection) {
                    // cancel selection
                    $headers
                        .attr('unselectable', 'on')
                        .bind('selectstart', false)
                        .css({
                            'user-select': 'none',
                            'MozUserSelect': 'none' // not needed for jQuery 1.8+
                        });
                }
            };

            // restore headers
            ts.restoreHeaders = function(table){
                var $cell,
                    c = $(table)[0].config;
                // don't use c.$headers here in case header cells were swapped
                c.$table.find(c.selectorHeaders).each(function(i){
                    $cell = $(this);
                    // only restore header cells if it is wrapped
                    // because this is also used by the updateAll method
                    if ($cell.find('.' + ts.css.headerIn).length){
                        $cell.html( c.headerContent[i] );
                    }
                });
            };

            ts.destroy = function(table, removeClasses, callback){
                table = $(table)[0];
                if (!table.hasInitialized) { return; }
                // remove all widgets
                ts.removeWidget(table, true, false);
                var events,
                    $t = $(table),
                    c = table.config,
                    $h = $t.find('thead:first'),
                    $r = $h.find('tr.' + ts.css.headerRow).removeClass(ts.css.headerRow + ' ' + c.cssHeaderRow),
                    $f = $t.find('tfoot:first > tr').children('th, td');
                if (removeClasses === false && $.inArray('uitheme', c.widgets) >= 0) {
                    // reapply uitheme classes, in case we want to maintain appearance
                    $t.trigger('applyWidgetId', ['uitheme']);
                    $t.trigger('applyWidgetId', ['zebra']);
                }
                // remove widget added rows, just in case
                $h.find('tr').not($r).remove();
                // disable tablesorter
                events = 'sortReset update updateAll updateRows updateCell addRows updateComplete sorton appendCache updateCache ' +
                    'applyWidgetId applyWidgets refreshWidgets destroy mouseup mouseleave keypress sortBegin sortEnd resetToLoadState '.split(' ')
                    .join(c.namespace + ' ');
                $t
                    .removeData('tablesorter')
                    .unbind( events.replace(/\s+/g, ' ') );
                c.$headers.add($f)
                    .removeClass( [ts.css.header, c.cssHeader, c.cssAsc, c.cssDesc, ts.css.sortAsc, ts.css.sortDesc, ts.css.sortNone].join(' ') )
                    .removeAttr('data-column')
                    .removeAttr('aria-label')
                    .attr('aria-disabled', 'true');
                $r.find(c.selectorSort).unbind( ('mousedown mouseup keypress '.split(' ').join(c.namespace + ' ')).replace(/\s+/g, ' ') );
                ts.restoreHeaders(table);
                $t.toggleClass(ts.css.table + ' ' + c.tableClass + ' tablesorter-' + c.theme, removeClasses === false);
                // clear flag in case the plugin is initialized again
                table.hasInitialized = false;
                delete table.config.cache;
                if (typeof callback === 'function') {
                    callback(table);
                }
            };

            // *** sort functions ***
            // regex used in natural sort
            ts.regex = {
                chunk : /(^([+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[0-9a-f]+$|\d+)/gi, // chunk/tokenize numbers & letters
                chunks: /(^\\0|\\0$)/, // replace chunks @ ends
                hex: /^0x[0-9a-f]+$/i // hex
            };

            // Natural sort - https://github.com/overset/javascript-natural-sort (date sorting removed)
            // this function will only accept strings, or you'll see 'TypeError: undefined is not a function'
            // I could add a = a.toString(); b = b.toString(); but it'll slow down the sort overall
            ts.sortNatural = function(a, b) {
                if (a === b) { return 0; }
                var xN, xD, yN, yD, xF, yF, i, mx,
                    r = ts.regex;
                // first try and sort Hex codes
                if (r.hex.test(b)) {
                    xD = parseInt(a.match(r.hex), 16);
                    yD = parseInt(b.match(r.hex), 16);
                    if ( xD < yD ) { return -1; }
                    if ( xD > yD ) { return 1; }
                }
                // chunk/tokenize
                xN = a.replace(r.chunk, '\\0$1\\0').replace(r.chunks, '').split('\\0');
                yN = b.replace(r.chunk, '\\0$1\\0').replace(r.chunks, '').split('\\0');
                mx = Math.max(xN.length, yN.length);
                // natural sorting through split numeric strings and default strings
                for (i = 0; i < mx; i++) {
                    // find floats not starting with '0', string or 0 if not defined
                    xF = isNaN(xN[i]) ? xN[i] || 0 : parseFloat(xN[i]) || 0;
                    yF = isNaN(yN[i]) ? yN[i] || 0 : parseFloat(yN[i]) || 0;
                    // handle numeric vs string comparison - number < string - (Kyle Adams)
                    if (isNaN(xF) !== isNaN(yF)) { return (isNaN(xF)) ? 1 : -1; }
                    // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
                    if (typeof xF !== typeof yF) {
                        xF += '';
                        yF += '';
                    }
                    if (xF < yF) { return -1; }
                    if (xF > yF) { return 1; }
                }
                return 0;
            };

            ts.sortNaturalAsc = function(a, b, col, table, c) {
                if (a === b) { return 0; }
                var e = c.string[ (c.empties[col] || c.emptyTo ) ];
                if (a === '' && e !== 0) { return typeof e === 'boolean' ? (e ? -1 : 1) : -e || -1; }
                if (b === '' && e !== 0) { return typeof e === 'boolean' ? (e ? 1 : -1) : e || 1; }
                return ts.sortNatural(a, b);
            };

            ts.sortNaturalDesc = function(a, b, col, table, c) {
                if (a === b) { return 0; }
                var e = c.string[ (c.empties[col] || c.emptyTo ) ];
                if (a === '' && e !== 0) { return typeof e === 'boolean' ? (e ? -1 : 1) : e || 1; }
                if (b === '' && e !== 0) { return typeof e === 'boolean' ? (e ? 1 : -1) : -e || -1; }
                return ts.sortNatural(b, a);
            };

            // basic alphabetical sort
            ts.sortText = function(a, b) {
                return a > b ? 1 : (a < b ? -1 : 0);
            };

            // return text string value by adding up ascii value
            // so the text is somewhat sorted when using a digital sort
            // this is NOT an alphanumeric sort
            ts.getTextValue = function(a, num, mx) {
                if (mx) {
                    // make sure the text value is greater than the max numerical value (mx)
                    var i, l = a ? a.length : 0, n = mx + num;
                    for (i = 0; i < l; i++) {
                        n += a.charCodeAt(i);
                    }
                    return num * n;
                }
                return 0;
            };

            ts.sortNumericAsc = function(a, b, num, mx, col, table) {
                if (a === b) { return 0; }
                var c = table.config,
                    e = c.string[ (c.empties[col] || c.emptyTo ) ];
                if (a === '' && e !== 0) { return typeof e === 'boolean' ? (e ? -1 : 1) : -e || -1; }
                if (b === '' && e !== 0) { return typeof e === 'boolean' ? (e ? 1 : -1) : e || 1; }
                if (isNaN(a)) { a = ts.getTextValue(a, num, mx); }
                if (isNaN(b)) { b = ts.getTextValue(b, num, mx); }
                return a - b;
            };

            ts.sortNumericDesc = function(a, b, num, mx, col, table) {
                if (a === b) { return 0; }
                var c = table.config,
                    e = c.string[ (c.empties[col] || c.emptyTo ) ];
                if (a === '' && e !== 0) { return typeof e === 'boolean' ? (e ? -1 : 1) : e || 1; }
                if (b === '' && e !== 0) { return typeof e === 'boolean' ? (e ? 1 : -1) : -e || -1; }
                if (isNaN(a)) { a = ts.getTextValue(a, num, mx); }
                if (isNaN(b)) { b = ts.getTextValue(b, num, mx); }
                return b - a;
            };

            ts.sortNumeric = function(a, b) {
                return a - b;
            };

            // used when replacing accented characters during sorting
            ts.characterEquivalents = {
                'a' : '\u00e1\u00e0\u00e2\u00e3\u00e4\u0105\u00e5', // áàâãäąå
                'A' : '\u00c1\u00c0\u00c2\u00c3\u00c4\u0104\u00c5', // ÁÀÂÃÄĄÅ
                'c' : '\u00e7\u0107\u010d', // çćč
                'C' : '\u00c7\u0106\u010c', // ÇĆČ
                'e' : '\u00e9\u00e8\u00ea\u00eb\u011b\u0119', // éèêëěę
                'E' : '\u00c9\u00c8\u00ca\u00cb\u011a\u0118', // ÉÈÊËĚĘ
                'i' : '\u00ed\u00ec\u0130\u00ee\u00ef\u0131', // íìİîïı
                'I' : '\u00cd\u00cc\u0130\u00ce\u00cf', // ÍÌİÎÏ
                'o' : '\u00f3\u00f2\u00f4\u00f5\u00f6', // óòôõö
                'O' : '\u00d3\u00d2\u00d4\u00d5\u00d6', // ÓÒÔÕÖ
                'ss': '\u00df', // ß (s sharp)
                'SS': '\u1e9e', // ẞ (Capital sharp s)
                'u' : '\u00fa\u00f9\u00fb\u00fc\u016f', // úùûüů
                'U' : '\u00da\u00d9\u00db\u00dc\u016e' // ÚÙÛÜŮ
            };
            ts.replaceAccents = function(s) {
                var a, acc = '[', eq = ts.characterEquivalents;
                if (!ts.characterRegex) {
                    ts.characterRegexArray = {};
                    for (a in eq) {
                        if (typeof a === 'string') {
                            acc += eq[a];
                            ts.characterRegexArray[a] = new RegExp('[' + eq[a] + ']', 'g');
                        }
                    }
                    ts.characterRegex = new RegExp(acc + ']');
                }
                if (ts.characterRegex.test(s)) {
                    for (a in eq) {
                        if (typeof a === 'string') {
                            s = s.replace( ts.characterRegexArray[a], a );
                        }
                    }
                }
                return s;
            };

            // *** utilities ***
            ts.isValueInArray = function(column, arry) {
                var indx, len = arry.length;
                for (indx = 0; indx < len; indx++) {
                    if (arry[indx][0] === column) {
                        return indx;
                    }
                }
                return -1;
            };

            ts.addParser = function(parser) {
                var i, l = ts.parsers.length, a = true;
                for (i = 0; i < l; i++) {
                    if (ts.parsers[i].id.toLowerCase() === parser.id.toLowerCase()) {
                        a = false;
                    }
                }
                if (a) {
                    ts.parsers.push(parser);
                }
            };

            // Use it to add a set of methods to table.config which will be available for all tables.
            // This should be done before table initialization
            ts.addInstanceMethods = function(methods) {
                $.extend(ts.instanceMethods, methods);
            };

            ts.getParserById = function(name) {
                /*jshint eqeqeq:false */
                if (name == 'false') { return false; }
                var i, l = ts.parsers.length;
                for (i = 0; i < l; i++) {
                    if (ts.parsers[i].id.toLowerCase() === (name.toString()).toLowerCase()) {
                        return ts.parsers[i];
                    }
                }
                return false;
            };

            ts.addWidget = function(widget) {
                ts.widgets.push(widget);
            };

            ts.hasWidget = function(table, name){
                table = $(table);
                return table.length && table[0].config && table[0].config.widgetInit[name] || false;
            };

            ts.getWidgetById = function(name) {
                var i, w, l = ts.widgets.length;
                for (i = 0; i < l; i++) {
                    w = ts.widgets[i];
                    if (w && w.hasOwnProperty('id') && w.id.toLowerCase() === name.toLowerCase()) {
                        return w;
                    }
                }
            };

            ts.applyWidgetOptions = function( table, c ){
                var indx, widget,
                    len = c.widgets.length,
                    wo = c.widgetOptions;
                if (len) {
                    for (indx = 0; indx < len; indx++) {
                        widget = ts.getWidgetById( c.widgets[indx] );
                        if ( widget && 'options' in widget ) {
                            wo = table.config.widgetOptions = $.extend( true, {}, widget.options, wo );
                        }
                    }
                }
            };

            ts.applyWidget = function(table, init, callback) {
                table = $(table)[0]; // in case this is called externally
                var indx, len, name,
                    c = table.config,
                    wo = c.widgetOptions,
                    tableClass = ' ' + c.table.className + ' ',
                    widgets = [],
                    time, time2, w, wd;
                // prevent numerous consecutive widget applications
                if (init !== false && table.hasInitialized && (table.isApplyingWidgets || table.isUpdating)) { return; }
                if (c.debug) { time = new Date(); }
                // look for widgets to apply from in table class
                // stop using \b otherwise this matches 'ui-widget-content' & adds 'content' widget
                wd = new RegExp( '\\s' + c.widgetClass.replace( /\{name\}/i, '([\\w-]+)' )+ '\\s', 'g' );
                if ( tableClass.match( wd ) ) {
                    // extract out the widget id from the table class (widget id's can include dashes)
                    w = tableClass.match( wd );
                    if ( w ) {
                        len = w.length;
                        for (indx = 0; indx < len; indx++) {
                            c.widgets.push( w[indx].replace( wd, '$1' ) );
                        }
                    }
                }
                if (c.widgets.length) {
                    table.isApplyingWidgets = true;
                    // ensure unique widget ids
                    c.widgets = $.grep(c.widgets, function(v, k){
                        return $.inArray(v, c.widgets) === k;
                    });
                    name = c.widgets || [];
                    len = name.length;
                    // build widget array & add priority as needed
                    for (indx = 0; indx < len; indx++) {
                        wd = ts.getWidgetById(name[indx]);
                        if (wd && wd.id) {
                            // set priority to 10 if not defined
                            if (!wd.priority) { wd.priority = 10; }
                            widgets[indx] = wd;
                        }
                    }
                    // sort widgets by priority
                    widgets.sort(function(a, b){
                        return a.priority < b.priority ? -1 : a.priority === b.priority ? 0 : 1;
                    });
                    // add/update selected widgets
                    len = widgets.length;
                    for (indx = 0; indx < len; indx++) {
                        if (widgets[indx]) {
                            if ( init || !( c.widgetInit[ widgets[indx].id ] ) ) {
                                // set init flag first to prevent calling init more than once (e.g. pager)
                                c.widgetInit[ widgets[indx].id ] = true;
                                if (table.hasInitialized) {
                                    // don't reapply widget options on tablesorter init
                                    ts.applyWidgetOptions( table, c );
                                }
                                if ( 'init' in widgets[indx] ) {
                                    if (c.debug) { time2 = new Date(); }
                                    widgets[indx].init(table, widgets[indx], c, wo);
                                    if (c.debug) { ts.benchmark('Initializing ' + widgets[indx].id + ' widget', time2); }
                                }
                            }
                            if ( !init && 'format' in widgets[indx] ) {
                                if (c.debug) { time2 = new Date(); }
                                widgets[indx].format(table, c, wo, false);
                                if (c.debug) { ts.benchmark( ( init ? 'Initializing ' : 'Applying ' ) + widgets[indx].id + ' widget', time2); }
                            }
                        }
                    }
                    // callback executed on init only
                    if (!init && typeof callback === 'function') {
                        callback(table);
                    }
                }
                setTimeout(function(){
                    table.isApplyingWidgets = false;
                    $.data(table, 'lastWidgetApplication', new Date());
                }, 0);
                if (c.debug) {
                    w = c.widgets.length;
                    benchmark('Completed ' + (init === true ? 'initializing ' : 'applying ') + w + ' widget' + (w !== 1 ? 's' : ''), time);
                }
            };

            ts.removeWidget = function(table, name, refreshing){
                table = $(table)[0];
                var i, widget, indx, len,
                    c = table.config;
                // if name === true, add all widgets from $.tablesorter.widgets
                if (name === true) {
                    name = [];
                    len = ts.widgets.length;
                    for (indx = 0; indx < len; indx++) {
                        widget = ts.widgets[indx];
                        if (widget && widget.id) {
                            name.push( widget.id );
                        }
                    }
                } else {
                    // name can be either an array of widgets names,
                    // or a space/comma separated list of widget names
                    name = ( $.isArray(name) ? name.join(',') : name || '' ).toLowerCase().split( /[\s,]+/ );
                }
                len = name.length;
                for (i = 0; i < len; i++) {
                    widget = ts.getWidgetById(name[i]);
                    indx = $.inArray( name[i], c.widgets );
                    if ( widget && 'remove' in widget ) {
                        if (c.debug && indx >= 0) { log( 'Removing "' + name[i] + '" widget' ); }
                        widget.remove(table, c, c.widgetOptions, refreshing);
                        c.widgetInit[ name[i] ] = false;
                    }
                    // don't remove the widget from config.widget if refreshing
                    if (indx >= 0 && refreshing !== true) {
                        c.widgets.splice( indx, 1 );
                    }
                }
            };

            ts.refreshWidgets = function(table, doAll, dontapply) {
                table = $(table)[0]; // see issue #243
                var indx,
                    c = table.config,
                    cw = c.widgets,
                    widgets = ts.widgets,
                    len = widgets.length,
                    list = [],
                    callback = function(table){
                        $(table).trigger('refreshComplete');
                    };
                // remove widgets not defined in config.widgets, unless doAll is true
                for (indx = 0; indx < len; indx++) {
                    if (widgets[indx] && widgets[indx].id && (doAll || $.inArray( widgets[indx].id, cw ) < 0)) {
                        list.push( widgets[indx].id );
                    }
                }
                ts.removeWidget( table, list.join(','), true );
                if (dontapply !== true) {
                    // call widget init if
                    ts.applyWidget(table, doAll || false, callback );
                    if (doAll) {
                        // apply widget format
                        ts.applyWidget(table, false, callback);
                    }
                } else {
                    callback(table);
                }
            };

            ts.getColumnText = function( table, column, callback ) {
                table = $( table )[0];
                var tbodyIndex, rowIndex, cache, row, tbodyLen, rowLen, raw, parsed, $cell, result,
                    hasCallback = typeof callback === 'function',
                    allColumns = column === 'all',
                    data = { raw : [], parsed: [], $cell: [] },
                    c = table.config;
                if ( !isEmptyObject( c ) ) {
                    tbodyLen = c.$tbodies.length;
                    for ( tbodyIndex = 0; tbodyIndex < tbodyLen; tbodyIndex++ ) {
                        cache = c.cache[ tbodyIndex ].normalized;
                        rowLen = cache.length;
                        for ( rowIndex = 0; rowIndex < rowLen; rowIndex++ ) {
                            result = true;
                            row =   cache[ rowIndex ];
                            parsed = ( allColumns ) ? row.slice(0, c.columns) : row[ column ];
                            row = row[ c.columns ];
                            raw = ( allColumns ) ? row.raw : row.raw[ column ];
                            $cell = ( allColumns ) ? row.$row.children() : row.$row.children().eq( column );
                            if ( hasCallback ) {
                                result = callback({
                                    tbodyIndex: tbodyIndex,
                                    rowIndex: rowIndex,
                                    parsed: parsed,
                                    raw: raw,
                                    $row: row.$row,
                                    $cell: $cell
                                });
                            }
                            if ( result !== false ) {
                                data.parsed.push( parsed );
                                data.raw.push( raw );
                                data.$cell.push( $cell );
                            }
                        }
                    }
                    // return everything
                    return data;
                }
            };

            // get sorter, string, empty, etc options for each column from
            // jQuery data, metadata, header option or header class name ('sorter-false')
            // priority = jQuery data > meta > headers option > header class name
            ts.getData = function(h, ch, key) {
                var val = '', $h = $(h), m, cl;
                if (!$h.length) { return ''; }
                m = $.metadata ? $h.metadata() : false;
                cl = ' ' + ($h.attr('class') || '');
                if (typeof $h.data(key) !== 'undefined' || typeof $h.data(key.toLowerCase()) !== 'undefined'){
                    // 'data-lockedOrder' is assigned to 'lockedorder'; but 'data-locked-order' is assigned to 'lockedOrder'
                    // 'data-sort-initial-order' is assigned to 'sortInitialOrder'
                    val += $h.data(key) || $h.data(key.toLowerCase());
                } else if (m && typeof m[key] !== 'undefined') {
                    val += m[key];
                } else if (ch && typeof ch[key] !== 'undefined') {
                    val += ch[key];
                } else if (cl !== ' ' && cl.match(' ' + key + '-')) {
                    // include sorter class name 'sorter-text', etc; now works with 'sorter-my-custom-parser'
                    val = cl.match( new RegExp('\\s' + key + '-([\\w-]+)') )[1] || '';
                }
                return $.trim(val);
            };

            ts.formatFloat = function(s, table) {
                if (typeof s !== 'string' || s === '') { return s; }
                // allow using formatFloat without a table; defaults to US number format
                var i,
                    t = table && table.config ? table.config.usNumberFormat !== false :
                        typeof table !== 'undefined' ? table : true;
                if (t) {
                    // US Format - 1,234,567.89 -> 1234567.89
                    s = s.replace(/,/g,'');
                } else {
                    // German Format = 1.234.567,89 -> 1234567.89
                    // French Format = 1 234 567,89 -> 1234567.89
                    s = s.replace(/[\s|\.]/g,'').replace(/,/g,'.');
                }
                if(/^\s*\([.\d]+\)/.test(s)) {
                    // make (#) into a negative number -> (10) = -10
                    s = s.replace(/^\s*\(([.\d]+)\)/, '-$1');
                }
                i = parseFloat(s);
                // return the text instead of zero
                return isNaN(i) ? $.trim(s) : i;
            };

            ts.isDigit = function(s) {
                // replace all unwanted chars and match
                return isNaN(s) ? (/^[\-+(]?\d+[)]?$/).test(s.toString().replace(/[,.'"\s]/g, '')) : true;
            };

        }()
    });

    // make shortcut
    var ts = $.tablesorter;

    // extend plugin scope
    $.fn.extend({
        tablesorter: ts.construct
    });

    // add default parsers
    ts.addParser({
        id: 'no-parser',
        is: function() {
            return false;
        },
        format: function() {
            return '';
        },
        type: 'text'
    });

    ts.addParser({
        id: 'text',
        is: function() {
            return true;
        },
        format: function(s, table) {
            var c = table.config;
            if (s) {
                s = $.trim( c.ignoreCase ? s.toLocaleLowerCase() : s );
                s = c.sortLocaleCompare ? ts.replaceAccents(s) : s;
            }
            return s;
        },
        type: 'text'
    });

    ts.addParser({
        id: 'digit',
        is: function(s) {
            return ts.isDigit(s);
        },
        format: function(s, table) {
            var n = ts.formatFloat((s || '').replace(/[^\w,. \-()]/g, ''), table);
            return s && typeof n === 'number' ? n : s ? $.trim( s && table.config.ignoreCase ? s.toLocaleLowerCase() : s ) : s;
        },
        type: 'numeric'
    });

    ts.addParser({
        id: 'currency',
        is: function(s) {
            return (/^\(?\d+[\u00a3$\u20ac\u00a4\u00a5\u00a2?.]|[\u00a3$\u20ac\u00a4\u00a5\u00a2?.]\d+\)?$/).test((s || '').replace(/[+\-,. ]/g,'')); // £$€¤¥¢
        },
        format: function(s, table) {
            var n = ts.formatFloat((s || '').replace(/[^\w,. \-()]/g, ''), table);
            return s && typeof n === 'number' ? n : s ? $.trim( s && table.config.ignoreCase ? s.toLocaleLowerCase() : s ) : s;
        },
        type: 'numeric'
    });

    ts.addParser({
        id: 'url',
        is: function(s) {
            return (/^(https?|ftp|file):\/\//).test(s);
        },
        format: function(s) {
            return s ? $.trim(s.replace(/(https?|ftp|file):\/\//, '')) : s;
        },
        parsed : true, // filter widget flag
        type: 'text'
    });

    ts.addParser({
        id: 'isoDate',
        is: function(s) {
            return (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/).test(s);
        },
        format: function(s, table) {
            var date = s ? new Date( s.replace(/-/g, '/') ) : s;
            return date instanceof Date && isFinite(date) ? date.getTime() : s;
        },
        type: 'numeric'
    });

    ts.addParser({
        id: 'percent',
        is: function(s) {
            return (/(\d\s*?%|%\s*?\d)/).test(s) && s.length < 15;
        },
        format: function(s, table) {
            return s ? ts.formatFloat(s.replace(/%/g, ''), table) : s;
        },
        type: 'numeric'
    });

    // added image parser to core v2.17.9
    ts.addParser({
        id: 'image',
        is: function(s, table, node, $node){
            return $node.find('img').length > 0;
        },
        format: function(s, table, cell) {
            return $(cell).find('img').attr(table.config.imgAttr || 'alt') || s;
        },
        parsed : true, // filter widget flag
        type: 'text'
    });

    ts.addParser({
        id: 'usLongDate',
        is: function(s) {
            // two digit years are not allowed cross-browser
            // Jan 01, 2013 12:34:56 PM or 01 Jan 2013
            return (/^[A-Z]{3,10}\.?\s+\d{1,2},?\s+(\d{4})(\s+\d{1,2}:\d{2}(:\d{2})?(\s+[AP]M)?)?$/i).test(s) || (/^\d{1,2}\s+[A-Z]{3,10}\s+\d{4}/i).test(s);
        },
        format: function(s, table) {
            var date = s ? new Date( s.replace(/(\S)([AP]M)$/i, '$1 $2') ) : s;
            return date instanceof Date && isFinite(date) ? date.getTime() : s;
        },
        type: 'numeric'
    });

    ts.addParser({
        id: 'shortDate', // 'mmddyyyy', 'ddmmyyyy' or 'yyyymmdd'
        is: function(s) {
            // testing for ##-##-#### or ####-##-##, so it's not perfect; time can be included
            return (/(^\d{1,2}[\/\s]\d{1,2}[\/\s]\d{4})|(^\d{4}[\/\s]\d{1,2}[\/\s]\d{1,2})/).test((s || '').replace(/\s+/g,' ').replace(/[\-.,]/g, '/'));
        },
        format: function(s, table, cell, cellIndex) {
            if (s) {
                var date, d,
                    c = table.config,
                    ci = c.$headerIndexed[ cellIndex ],
                    format = ci.length && ci[0].dateFormat || ts.getData( ci, ts.getColumnData( table, c.headers, cellIndex ), 'dateFormat') || c.dateFormat;
                d = s.replace(/\s+/g, ' ').replace(/[\-.,]/g, '/'); // escaped - because JSHint in Firefox was showing it as an error
                if (format === 'mmddyyyy') {
                    d = d.replace(/(\d{1,2})[\/\s](\d{1,2})[\/\s](\d{4})/, '$3/$1/$2');
                } else if (format === 'ddmmyyyy') {
                    d = d.replace(/(\d{1,2})[\/\s](\d{1,2})[\/\s](\d{4})/, '$3/$2/$1');
                } else if (format === 'yyyymmdd') {
                    d = d.replace(/(\d{4})[\/\s](\d{1,2})[\/\s](\d{1,2})/, '$1/$2/$3');
                }
                date = new Date(d);
                return date instanceof Date && isFinite(date) ? date.getTime() : s;
            }
            return s;
        },
        type: 'numeric'
    });

    ts.addParser({
        id: 'time',
        is: function(s) {
            return (/^(([0-2]?\d:[0-5]\d)|([0-1]?\d:[0-5]\d\s?([AP]M)))$/i).test(s);
        },
        format: function(s, table) {
            var date = s ? new Date( '2000/01/01 ' + s.replace(/(\S)([AP]M)$/i, '$1 $2') ) : s;
            return date instanceof Date && isFinite(date) ? date.getTime() : s;
        },
        type: 'numeric'
    });

    ts.addParser({
        id: 'metadata',
        is: function() {
            return false;
        },
        format: function(s, table, cell) {
            var c = table.config,
            p = (!c.parserMetadataName) ? 'sortValue' : c.parserMetadataName;
            return $(cell).metadata()[p];
        },
        type: 'numeric'
    });

    // add default widgets
    ts.addWidget({
        id: 'zebra',
        priority: 90,
        format: function(table, c, wo) {
            var $tb, $tv, $tr, row, even, time, k,
                child = new RegExp(c.cssChildRow, 'i'),
                b = c.$tbodies.add( $( c.namespace + '_extra_table' ).children( 'tbody' ) );
            if (c.debug) {
                time = new Date();
            }
            for (k = 0; k < b.length; k++ ) {
                // loop through the visible rows
                row = 0;
                $tb = b.eq(k);
                $tv = $tb.children('tr:visible').not(c.selectorRemove);
                // revered back to using jQuery each - strangely it's the fastest method
                /*jshint loopfunc:true */
                $tv.each(function(){
                    $tr = $(this);
                    // style child rows the same way the parent row was styled
                    if (!child.test(this.className)) { row++; }
                    even = (row % 2 === 0);
                    $tr.removeClass(wo.zebra[even ? 1 : 0]).addClass(wo.zebra[even ? 0 : 1]);
                });
            }
        },
        remove: function(table, c, wo, refreshing){
            if (refreshing) { return; }
            var k, $tb,
                b = c.$tbodies,
                rmv = (wo.zebra || [ 'even', 'odd' ]).join(' ');
            for (k = 0; k < b.length; k++ ){
                $tb = ts.processTbody(table, b.eq(k), true); // remove tbody
                $tb.children().removeClass(rmv);
                ts.processTbody(table, $tb, false); // restore tbody
            }
        }
    });

})(jQuery);
/*** This file is dynamically generated ***
█████▄ ▄████▄   █████▄ ▄████▄ ██████   ███████▄ ▄████▄ █████▄ ██ ██████ ██  ██
██  ██ ██  ██   ██  ██ ██  ██   ██     ██ ██ ██ ██  ██ ██  ██ ██ ██     ██  ██
██  ██ ██  ██   ██  ██ ██  ██   ██     ██ ██ ██ ██  ██ ██  ██ ██ ██▀▀   ▀▀▀▀██
█████▀ ▀████▀   ██  ██ ▀████▀   ██     ██ ██ ██ ▀████▀ █████▀ ██ ██     █████▀
*/
/*! tablesorter (FORK) - updated 04-08-2015 (v2.21.5)*/
/* Includes widgets ( storage,uitheme,columns,filter,stickyHeaders,resizable,saveSort ) */
(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = factory(require('jquery'));
	} else {
		factory(jQuery);
	}
}(function($) {

/*! Widget: storage - updated 3/26/2015 (v2.21.3) */
;(function ($, window, document) {
'use strict';

var ts = $.tablesorter = $.tablesorter || {};
// *** Store data in local storage, with a cookie fallback ***
/* IE7 needs JSON library for JSON.stringify - (http://caniuse.com/#search=json)
   if you need it, then include https://github.com/douglascrockford/JSON-js

   $.parseJSON is not available is jQuery versions older than 1.4.1, using older
   versions will only allow storing information for one page at a time

   // *** Save data (JSON format only) ***
   // val must be valid JSON... use http://jsonlint.com/ to ensure it is valid
   var val = { "mywidget" : "data1" }; // valid JSON uses double quotes
   // $.tablesorter.storage(table, key, val);
   $.tablesorter.storage(table, 'tablesorter-mywidget', val);

   // *** Get data: $.tablesorter.storage(table, key); ***
   v = $.tablesorter.storage(table, 'tablesorter-mywidget');
   // val may be empty, so also check for your data
   val = (v && v.hasOwnProperty('mywidget')) ? v.mywidget : '';
   alert(val); // "data1" if saved, or "" if not
*/
ts.storage = function(table, key, value, options) {
	table = $(table)[0];
	var cookieIndex, cookies, date,
		hasStorage = false,
		values = {},
		c = table.config,
		wo = c && c.widgetOptions,
		storageType = ( options && options.useSessionStorage ) || ( wo && wo.storage_useSessionStorage ) ?
			'sessionStorage' : 'localStorage',
		$table = $(table),
		// id from (1) options ID, (2) table "data-table-group" attribute, (3) widgetOptions.storage_tableId,
		// (4) table ID, then (5) table index
		id = options && options.id ||
			$table.attr( options && options.group || wo && wo.storage_group || 'data-table-group') ||
			wo && wo.storage_tableId || table.id || $('.tablesorter').index( $table ),
		// url from (1) options url, (2) table "data-table-page" attribute, (3) widgetOptions.storage_fixedUrl,
		// (4) table.config.fixedUrl (deprecated), then (5) window location path
		url = options && options.url ||
			$table.attr(options && options.page || wo && wo.storage_page || 'data-table-page') ||
			wo && wo.storage_fixedUrl || c && c.fixedUrl || window.location.pathname;
	// https://gist.github.com/paulirish/5558557
	if (storageType in window) {
		try {
			window[storageType].setItem('_tmptest', 'temp');
			hasStorage = true;
			window[storageType].removeItem('_tmptest');
		} catch(error) {
			if (c && c.debug) {
				ts.log( storageType + ' is not supported in this browser' );
			}
		}
	}
	// *** get value ***
	if ($.parseJSON) {
		if (hasStorage) {
			values = $.parseJSON( window[storageType][key] || 'null' ) || {};
		} else {
			// old browser, using cookies
			cookies = document.cookie.split(/[;\s|=]/);
			// add one to get from the key to the value
			cookieIndex = $.inArray(key, cookies) + 1;
			values = (cookieIndex !== 0) ? $.parseJSON(cookies[cookieIndex] || 'null') || {} : {};
		}
	}
	// allow value to be an empty string too
	if ((value || value === '') && window.JSON && JSON.hasOwnProperty('stringify')) {
		// add unique identifiers = url pathname > table ID/index on page > data
		if (!values[url]) {
			values[url] = {};
		}
		values[url][id] = value;
		// *** set value ***
		if (hasStorage) {
			window[storageType][key] = JSON.stringify(values);
		} else {
			date = new Date();
			date.setTime(date.getTime() + (31536e+6)); // 365 days
			document.cookie = key + '=' + (JSON.stringify(values)).replace(/\"/g,'\"') + '; expires=' + date.toGMTString() + '; path=/';
		}
	} else {
		return values && values[url] ? values[url][id] : '';
	}
};

})(jQuery, window, document);

/*! Widget: uitheme - updated 3/26/2015 (v2.21.3) */
;(function ($) {
'use strict';
var ts = $.tablesorter = $.tablesorter || {};

ts.themes = {
	'bootstrap' : {
		table        : 'table table-bordered table-striped',
		caption      : 'caption',
		// header class names
		header       : 'bootstrap-header', // give the header a gradient background (theme.bootstrap_2.css)
		sortNone     : '',
		sortAsc      : '',
		sortDesc     : '',
		active       : '', // applied when column is sorted
		hover        : '', // custom css required - a defined bootstrap style may not override other classes
		// icon class names
		icons        : '', // add "icon-white" to make them white; this icon class is added to the <i> in the header
		iconSortNone : 'bootstrap-icon-unsorted', // class name added to icon when column is not sorted
		iconSortAsc  : 'icon-chevron-up glyphicon glyphicon-chevron-up', // class name added to icon when column has ascending sort
		iconSortDesc : 'icon-chevron-down glyphicon glyphicon-chevron-down', // class name added to icon when column has descending sort
		filterRow    : '', // filter row class
		footerRow    : '',
		footerCells  : '',
		even         : '', // even row zebra striping
		odd          : ''  // odd row zebra striping
	},
	'jui' : {
		table        : 'ui-widget ui-widget-content ui-corner-all', // table classes
		caption      : 'ui-widget-content',
		// header class names
		header       : 'ui-widget-header ui-corner-all ui-state-default', // header classes
		sortNone     : '',
		sortAsc      : '',
		sortDesc     : '',
		active       : 'ui-state-active', // applied when column is sorted
		hover        : 'ui-state-hover',  // hover class
		// icon class names
		icons        : 'ui-icon', // icon class added to the <i> in the header
		iconSortNone : 'ui-icon-carat-2-n-s', // class name added to icon when column is not sorted
		iconSortAsc  : 'ui-icon-carat-1-n', // class name added to icon when column has ascending sort
		iconSortDesc : 'ui-icon-carat-1-s', // class name added to icon when column has descending sort
		filterRow    : '',
		footerRow    : '',
		footerCells  : '',
		even         : 'ui-widget-content', // even row zebra striping
		odd          : 'ui-state-default'   // odd row zebra striping
	}
};

$.extend(ts.css, {
	wrapper : 'tablesorter-wrapper' // ui theme & resizable
});

ts.addWidget({
	id: "uitheme",
	priority: 10,
	format: function(table, c, wo) {
		var i, hdr, icon, time, $header, $icon, $tfoot, $h, oldtheme, oldremove, oldIconRmv, hasOldTheme,
			themesAll = ts.themes,
			$table = c.$table.add( $( c.namespace + '_extra_table' ) ),
			$headers = c.$headers.add( $( c.namespace + '_extra_headers' ) ),
			theme = c.theme || 'jui',
			themes = themesAll[theme] || {},
			remove = $.trim( [ themes.sortNone, themes.sortDesc, themes.sortAsc, themes.active ].join( ' ' ) ),
			iconRmv = $.trim( [ themes.iconSortNone, themes.iconSortDesc, themes.iconSortAsc ].join( ' ' ) );
		if (c.debug) { time = new Date(); }
		// initialization code - run once
		if (!$table.hasClass('tablesorter-' + theme) || c.theme !== c.appliedTheme || !wo.uitheme_applied) {
			wo.uitheme_applied = true;
			oldtheme = themesAll[c.appliedTheme] || {};
			hasOldTheme = !$.isEmptyObject(oldtheme);
			oldremove =  hasOldTheme ? [ oldtheme.sortNone, oldtheme.sortDesc, oldtheme.sortAsc, oldtheme.active ].join( ' ' ) : '';
			oldIconRmv = hasOldTheme ? [ oldtheme.iconSortNone, oldtheme.iconSortDesc, oldtheme.iconSortAsc ].join( ' ' ) : '';
			if (hasOldTheme) {
				wo.zebra[0] = $.trim( ' ' + wo.zebra[0].replace(' ' + oldtheme.even, '') );
				wo.zebra[1] = $.trim( ' ' + wo.zebra[1].replace(' ' + oldtheme.odd, '') );
				c.$tbodies.children().removeClass( [oldtheme.even, oldtheme.odd].join(' ') );
			}
			// update zebra stripes
			if (themes.even) { wo.zebra[0] += ' ' + themes.even; }
			if (themes.odd) { wo.zebra[1] += ' ' + themes.odd; }
			// add caption style
			$table.children('caption')
				.removeClass(oldtheme.caption || '')
				.addClass(themes.caption);
			// add table/footer class names
			$tfoot = $table
				// remove other selected themes
				.removeClass( (c.appliedTheme ? 'tablesorter-' + (c.appliedTheme || '') : '') + ' ' + (oldtheme.table || '') )
				.addClass('tablesorter-' + theme + ' ' + (themes.table || '')) // add theme widget class name
				.children('tfoot');
			c.appliedTheme = c.theme;

			if ($tfoot.length) {
				$tfoot
					// if oldtheme.footerRow or oldtheme.footerCells are undefined, all class names are removed
					.children('tr').removeClass(oldtheme.footerRow || '').addClass(themes.footerRow)
					.children('th, td').removeClass(oldtheme.footerCells || '').addClass(themes.footerCells);
			}
			// update header classes
			$headers
				.removeClass( (hasOldTheme ? [oldtheme.header, oldtheme.hover, oldremove].join(' ') : '') || '' )
				.addClass(themes.header)
				.not('.sorter-false')
				.unbind('mouseenter.tsuitheme mouseleave.tsuitheme')
				.bind('mouseenter.tsuitheme mouseleave.tsuitheme', function(event) {
					// toggleClass with switch added in jQuery 1.3
					$(this)[ event.type === 'mouseenter' ? 'addClass' : 'removeClass' ](themes.hover || '');
				});

			$headers.each(function(){
				var $this = $(this);
				if (!$this.find('.' + ts.css.wrapper).length) {
					// Firefox needs this inner div to position the icon & resizer correctly
					$this.wrapInner('<div class="' + ts.css.wrapper + '" style="position:relative;height:100%;width:100%"></div>');
				}
			});
			if (c.cssIcon) {
				// if c.cssIcon is '', then no <i> is added to the header
				$headers
					.find('.' + ts.css.icon)
					.removeClass(hasOldTheme ? [oldtheme.icons, oldIconRmv].join(' ') : '')
					.addClass(themes.icons || '');
			}
			if ($table.hasClass('hasFilters')) {
				$table.children('thead').children('.' + ts.css.filterRow)
					.removeClass(hasOldTheme ? oldtheme.filterRow || '' : '')
					.addClass(themes.filterRow || '');
			}
		}
		for (i = 0; i < c.columns; i++) {
			$header = c.$headers
				.add($(c.namespace + '_extra_headers'))
				.not('.sorter-false')
				.filter('[data-column="' + i + '"]');
			$icon = (ts.css.icon) ? $header.find('.' + ts.css.icon) : $();
			$h = $headers.not('.sorter-false').filter('[data-column="' + i + '"]:last');
			if ($h.length) {
				$header.removeClass(remove);
				$icon.removeClass(iconRmv);
				if ($h[0].sortDisabled) {
					// no sort arrows for disabled columns!
					$icon.removeClass(themes.icons || '');
				} else {
					hdr = themes.sortNone;
					icon = themes.iconSortNone;
					if ($h.hasClass(ts.css.sortAsc)) {
						hdr = [themes.sortAsc, themes.active].join(' ');
						icon = themes.iconSortAsc;
					} else if ($h.hasClass(ts.css.sortDesc)) {
						hdr = [themes.sortDesc, themes.active].join(' ');
						icon = themes.iconSortDesc;
					}
					$header.addClass(hdr);
					$icon.addClass(icon || '');
				}
			}
		}
		if (c.debug) {
			ts.benchmark("Applying " + theme + " theme", time);
		}
	},
	remove: function(table, c, wo, refreshing) {
		if (!wo.uitheme_applied) { return; }
		var $table = c.$table,
			theme = c.appliedTheme || 'jui',
			themes = ts.themes[ theme ] || ts.themes.jui,
			$headers = $table.children('thead').children(),
			remove = themes.sortNone + ' ' + themes.sortDesc + ' ' + themes.sortAsc,
			iconRmv = themes.iconSortNone + ' ' + themes.iconSortDesc + ' ' + themes.iconSortAsc;
		$table.removeClass('tablesorter-' + theme + ' ' + themes.table);
		wo.uitheme_applied = false;
		if (refreshing) { return; }
		$table.find(ts.css.header).removeClass(themes.header);
		$headers
			.unbind('mouseenter.tsuitheme mouseleave.tsuitheme') // remove hover
			.removeClass(themes.hover + ' ' + remove + ' ' + themes.active)
			.filter('.' + ts.css.filterRow)
			.removeClass(themes.filterRow);
		$headers.find('.' + ts.css.icon).removeClass(themes.icons + ' ' + iconRmv);
	}
});

})(jQuery);

/*! Widget: columns */
;(function ($) {
'use strict';
var ts = $.tablesorter = $.tablesorter || {};

ts.addWidget({
	id: "columns",
	priority: 30,
	options : {
		columns : [ "primary", "secondary", "tertiary" ]
	},
	format: function(table, c, wo) {
		var $tbody, tbodyIndex, $rows, rows, $row, $cells, remove, indx,
			$table = c.$table,
			$tbodies = c.$tbodies,
			sortList = c.sortList,
			len = sortList.length,
			// removed c.widgetColumns support
			css = wo && wo.columns || [ "primary", "secondary", "tertiary" ],
			last = css.length - 1;
			remove = css.join(' ');
		// check if there is a sort (on initialization there may not be one)
		for (tbodyIndex = 0; tbodyIndex < $tbodies.length; tbodyIndex++ ) {
			$tbody = ts.processTbody(table, $tbodies.eq(tbodyIndex), true); // detach tbody
			$rows = $tbody.children('tr');
			// loop through the visible rows
			$rows.each(function() {
				$row = $(this);
				if (this.style.display !== 'none') {
					// remove all columns class names
					$cells = $row.children().removeClass(remove);
					// add appropriate column class names
					if (sortList && sortList[0]) {
						// primary sort column class
						$cells.eq(sortList[0][0]).addClass(css[0]);
						if (len > 1) {
							for (indx = 1; indx < len; indx++) {
								// secondary, tertiary, etc sort column classes
								$cells.eq(sortList[indx][0]).addClass( css[indx] || css[last] );
							}
						}
					}
				}
			});
			ts.processTbody(table, $tbody, false);
		}
		// add classes to thead and tfoot
		rows = wo.columns_thead !== false ? ['thead tr'] : [];
		if (wo.columns_tfoot !== false) {
			rows.push('tfoot tr');
		}
		if (rows.length) {
			$rows = $table.find( rows.join(',') ).children().removeClass(remove);
			if (len) {
				for (indx = 0; indx < len; indx++) {
					// add primary. secondary, tertiary, etc sort column classes
					$rows.filter('[data-column="' + sortList[indx][0] + '"]').addClass(css[indx] || css[last]);
				}
			}
		}
	},
	remove: function(table, c, wo) {
		var tbodyIndex, $tbody,
			$tbodies = c.$tbodies,
			remove = (wo.columns || [ "primary", "secondary", "tertiary" ]).join(' ');
		c.$headers.removeClass(remove);
		c.$table.children('tfoot').children('tr').children('th, td').removeClass(remove);
		for (tbodyIndex = 0; tbodyIndex < $tbodies.length; tbodyIndex++ ) {
			$tbody = ts.processTbody(table, $tbodies.eq(tbodyIndex), true); // remove tbody
			$tbody.children('tr').each(function() {
				$(this).children().removeClass(remove);
			});
			ts.processTbody(table, $tbody, false); // restore tbody
		}
	}
});

})(jQuery);

/*! Widget: filter - updated 3/26/2015 (v2.21.3) *//*
 * Requires tablesorter v2.8+ and jQuery 1.7+
 * by Rob Garrison
 */
;(function ($) {
'use strict';
var ts = $.tablesorter = $.tablesorter || {},
	tscss = ts.css;

$.extend(tscss, {
	filterRow      : 'tablesorter-filter-row',
	filter         : 'tablesorter-filter',
	filterDisabled : 'disabled',
	filterRowHide  : 'hideme'
});

ts.addWidget({
	id: "filter",
	priority: 50,
	options : {
		filter_childRows     : false, // if true, filter includes child row content in the search
		filter_columnFilters : true,  // if true, a filter will be added to the top of each table column
		filter_columnAnyMatch: true,  // if true, allows using "#:{query}" in AnyMatch searches (column:query)
		filter_cellFilter    : '',    // css class name added to the filter cell (string or array)
		filter_cssFilter     : '',    // css class name added to the filter row & each input in the row (tablesorter-filter is ALWAYS added)
		filter_defaultFilter : {},    // add a default column filter type "~{query}" to make fuzzy searches default; "{q1} AND {q2}" to make all searches use a logical AND.
		filter_excludeFilter : {},    // filters to exclude, per column
		filter_external      : '',    // jQuery selector string (or jQuery object) of external filters
		filter_filteredRow   : 'filtered', // class added to filtered rows; needed by pager plugin
		filter_formatter     : null,  // add custom filter elements to the filter row
		filter_functions     : null,  // add custom filter functions using this option
		filter_hideEmpty     : true,  // hide filter row when table is empty
		filter_hideFilters   : false, // collapse filter row when mouse leaves the area
		filter_ignoreCase    : true,  // if true, make all searches case-insensitive
		filter_liveSearch    : true,  // if true, search column content while the user types (with a delay)
		filter_onlyAvail     : 'filter-onlyAvail', // a header with a select dropdown & this class name will only show available (visible) options within the drop down
		filter_placeholder   : { search : '', select : '' }, // default placeholder text (overridden by any header "data-placeholder" setting)
		filter_reset         : null,  // jQuery selector string of an element used to reset the filters
		filter_saveFilters   : false, // Use the $.tablesorter.storage utility to save the most recent filters
		filter_searchDelay   : 300,   // typing delay in milliseconds before starting a search
		filter_searchFiltered: true,  // allow searching through already filtered rows in special circumstances; will speed up searching in large tables if true
		filter_selectSource  : null,  // include a function to return an array of values to be added to the column filter select
		filter_startsWith    : false, // if true, filter start from the beginning of the cell contents
		filter_useParsedData : false, // filter all data using parsed content
		filter_serversideFiltering : false, // if true, server-side filtering should be performed because client-side filtering will be disabled, but the ui and events will still be used.
		filter_defaultAttrib : 'data-value', // data attribute in the header cell that contains the default filter value
		filter_selectSourceSeparator : '|' // filter_selectSource array text left of the separator is added to the option value, right into the option text
	},
	format: function(table, c, wo) {
		if (!c.$table.hasClass('hasFilters')) {
			ts.filter.init(table, c, wo);
		}
	},
	remove: function(table, c, wo, refreshing) {
		var tbodyIndex, $tbody,
			$table = c.$table,
			$tbodies = c.$tbodies,
			events = 'addRows updateCell update updateRows updateComplete appendCache filterReset filterEnd search '.split(' ').join(c.namespace + 'filter ');
		$table
			.removeClass('hasFilters')
			// add .tsfilter namespace to all BUT search
			.unbind( events.replace(/\s+/g, ' ') )
			// remove the filter row even if refreshing, because the column might have been moved
			.find('.' + tscss.filterRow).remove();
		if (refreshing) { return; }
		for (tbodyIndex = 0; tbodyIndex < $tbodies.length; tbodyIndex++ ) {
			$tbody = ts.processTbody(table, $tbodies.eq(tbodyIndex), true); // remove tbody
			$tbody.children().removeClass(wo.filter_filteredRow).show();
			ts.processTbody(table, $tbody, false); // restore tbody
		}
		if (wo.filter_reset) {
			$(document).undelegate(wo.filter_reset, 'click.tsfilter');
		}
	}
});

ts.filter = {

	// regex used in filter "check" functions - not for general use and not documented
	regex: {
		regex     : /^\/((?:\\\/|[^\/])+)\/([mig]{0,3})?$/, // regex to test for regex
		child     : /tablesorter-childRow/, // child row class name; this gets updated in the script
		filtered  : /filtered/, // filtered (hidden) row class name; updated in the script
		type      : /undefined|number/, // check type
		exact     : /(^[\"\'=]+)|([\"\'=]+$)/g, // exact match (allow '==')
		nondigit  : /[^\w,. \-()]/g, // replace non-digits (from digit & currency parser)
		operators : /[<>=]/g, // replace operators
		query     : '(q|query)' // replace filter queries
	},
		// function( c, data ) { }
		// c = table.config
		// data.filter = array of filter input values;
		// data.iFilter = same array, except lowercase (if wo.filter_ignoreCase is true)
		// data.exact = table cell text (or parsed data if column parser enabled)
		// data.iExact = same as data.exact, except lowercase (if wo.filter_ignoreCase is true)
		// data.cache = table cell text from cache, so it has been parsed (& in all lower case if config.ignoreCase is true)
		// data.index = column index; table = table element (DOM)
		// data.parsed = array (by column) of boolean values (from filter_useParsedData or "filter-parsed" class)
	types: {
		// Look for regex
		regex: function( c, data ) {
			if ( ts.filter.regex.regex.test(data.iFilter) ) {
				var matches,
					regex = ts.filter.regex.regex.exec(data.iFilter);
				try {
					matches = new RegExp(regex[1], regex[2]).test( data.iExact );
				} catch (error) {
					matches = false;
				}
				return matches;
			}
			return null;
		},
		// Look for operators >, >=, < or <=
		operators: function( c, data ) {
			if ( /^[<>]=?/.test(data.iFilter) ) {
				var cachedValue, result,
					table = c.table,
					index = data.index,
					parsed = data.parsed[index],
					query = ts.formatFloat( data.iFilter.replace(ts.filter.regex.operators, ''), table ),
					parser = c.parsers[index],
					savedSearch = query;
				// parse filter value in case we're comparing numbers (dates)
				if (parsed || parser.type === 'numeric') {
					result = ts.filter.parseFilter(c, $.trim('' + data.iFilter.replace(ts.filter.regex.operators, '')), index, parsed, true);
					query = ( typeof result === "number" && result !== '' && !isNaN(result) ) ? result : query;
				}

				// iExact may be numeric - see issue #149;
				// check if cached is defined, because sometimes j goes out of range? (numeric columns)
				cachedValue = ( parsed || parser.type === 'numeric' ) && !isNaN(query) && typeof data.cache !== 'undefined' ? data.cache :
					isNaN(data.iExact) ? ts.formatFloat( data.iExact.replace(ts.filter.regex.nondigit, ''), table) :
					ts.formatFloat( data.iExact, table );

				if ( />/.test(data.iFilter) ) { result = />=/.test(data.iFilter) ? cachedValue >= query : cachedValue > query; }
				if ( /</.test(data.iFilter) ) { result = /<=/.test(data.iFilter) ? cachedValue <= query : cachedValue < query; }
				// keep showing all rows if nothing follows the operator
				if ( !result && savedSearch === '' ) { result = true; }
				return result;
			}
			return null;
		},
		// Look for a not match
		notMatch: function( c, data ) {
			if ( /^\!/.test(data.iFilter) ) {
				var indx,
					filter = ts.filter.parseFilter(c, data.iFilter.replace('!', ''), data.index, data.parsed[data.index]) || '';
				if (ts.filter.regex.exact.test(filter)) {
					// look for exact not matches - see #628
					filter = filter.replace(ts.filter.regex.exact, '');
					return filter === '' ? true : $.trim(filter) !== data.iExact;
				} else {
					indx = data.iExact.search( $.trim(filter) );
					return filter === '' ? true : !(c.widgetOptions.filter_startsWith ? indx === 0 : indx >= 0);
				}
			}
			return null;
		},
		// Look for quotes or equals to get an exact match; ignore type since iExact could be numeric
		exact: function( c, data ) {
			/*jshint eqeqeq:false */
			if (ts.filter.regex.exact.test(data.iFilter)) {
				var filter = ts.filter.parseFilter(c, data.iFilter.replace(ts.filter.regex.exact, ''), data.index, data.parsed[data.index]) || '';
				return data.anyMatch ? $.inArray(filter, data.rowArray) >= 0 : filter == data.iExact;
			}
			return null;
		},
		// Look for an AND or && operator (logical and)
		and : function( c, data ) {
			if ( ts.filter.regex.andTest.test(data.filter) ) {
				var index = data.index,
					parsed = data.parsed[index],
					query = data.iFilter.split( ts.filter.regex.andSplit ),
					result = data.iExact.search( $.trim( ts.filter.parseFilter(c, query[0], index, parsed) ) ) >= 0,
					indx = query.length - 1;
				while (result && indx) {
					result = result && data.iExact.search( $.trim( ts.filter.parseFilter(c, query[indx], index, parsed) ) ) >= 0;
					indx--;
				}
				return result;
			}
			return null;
		},
		// Look for a range (using " to " or " - ") - see issue #166; thanks matzhu!
		range : function( c, data ) {
			if ( ts.filter.regex.toTest.test(data.iFilter) ) {
				var result, tmp,
					table = c.table,
					index = data.index,
					parsed = data.parsed[index],
					// make sure the dash is for a range and not indicating a negative number
					query = data.iFilter.split( ts.filter.regex.toSplit ),
					range1 = ts.formatFloat( ts.filter.parseFilter(c, query[0].replace(ts.filter.regex.nondigit, '') || '', index, parsed), table ),
					range2 = ts.formatFloat( ts.filter.parseFilter(c, query[1].replace(ts.filter.regex.nondigit, '') || '', index, parsed), table );
					// parse filter value in case we're comparing numbers (dates)
				if (parsed || c.parsers[index].type === 'numeric') {
					result = c.parsers[index].format('' + query[0], table, c.$headers.eq(index), index);
					range1 = (result !== '' && !isNaN(result)) ? result : range1;
					result = c.parsers[index].format('' + query[1], table, c.$headers.eq(index), index);
					range2 = (result !== '' && !isNaN(result)) ? result : range2;
				}
				result = ( parsed || c.parsers[index].type === 'numeric' ) && !isNaN(range1) && !isNaN(range2) ? data.cache :
					isNaN(data.iExact) ? ts.formatFloat( data.iExact.replace(ts.filter.regex.nondigit, ''), table) :
					ts.formatFloat( data.iExact, table );
				if (range1 > range2) { tmp = range1; range1 = range2; range2 = tmp; } // swap
				return (result >= range1 && result <= range2) || (range1 === '' || range2 === '');
			}
			return null;
		},
		// Look for wild card: ? = single, * = multiple, or | = logical OR
		wild : function( c, data ) {
			if ( /[\?\*\|]/.test(data.iFilter) || ts.filter.regex.orReplace.test(data.filter) ) {
				var index = data.index,
					parsed = data.parsed[index],
					query = ts.filter.parseFilter(c, data.iFilter.replace(ts.filter.regex.orReplace, "|"), index, parsed) || '';
				// look for an exact match with the "or" unless the "filter-match" class is found
				if (!c.$headerIndexed[index].hasClass('filter-match') && /\|/.test(query)) {
					// show all results while using filter match. Fixes #727
					if (query[ query.length - 1 ] === '|') { query += '*'; }
					query = data.anyMatch && $.isArray(data.rowArray) ? '(' + query + ')' : '^(' + query + ')$';
				}
				// parsing the filter may not work properly when using wildcards =/
				return new RegExp( query.replace(/\?/g, '\\S{1}').replace(/\*/g, '\\S*') ).test(data.iExact);
			}
			return null;
		},
		// fuzzy text search; modified from https://github.com/mattyork/fuzzy (MIT license)
		fuzzy: function( c, data ) {
			if ( /^~/.test(data.iFilter) ) {
				var indx,
					patternIndx = 0,
					len = data.iExact.length,
					pattern = ts.filter.parseFilter(c, data.iFilter.slice(1), data.index, data.parsed[data.index]) || '';
				for (indx = 0; indx < len; indx++) {
					if (data.iExact[indx] === pattern[patternIndx]) {
						patternIndx += 1;
					}
				}
				if (patternIndx === pattern.length) {
					return true;
				}
				return false;
			}
			return null;
		}
	},
	init: function(table, c, wo) {
		// filter language options
		ts.language = $.extend(true, {}, {
			to  : 'to',
			or  : 'or',
			and : 'and'
		}, ts.language);

		var options, string, txt, $header, column, filters, val, fxn, noSelect,
			regex = ts.filter.regex;
		c.$table.addClass('hasFilters');

		// define timers so using clearTimeout won't cause an undefined error
		wo.searchTimer = null;
		wo.filter_initTimer = null;
		wo.filter_formatterCount = 0;
		wo.filter_formatterInit = [];
		wo.filter_anyColumnSelector = '[data-column="all"],[data-column="any"]';
		wo.filter_multipleColumnSelector = '[data-column*="-"],[data-column*=","]';

		txt = '\\{' + ts.filter.regex.query + '\\}';
		$.extend( regex, {
			child : new RegExp(c.cssChildRow),
			filtered : new RegExp(wo.filter_filteredRow),
			alreadyFiltered : new RegExp('(\\s+(' + ts.language.or + '|-|' + ts.language.to + ')\\s+)', 'i'),
			toTest : new RegExp('\\s+(-|' + ts.language.to + ')\\s+', 'i'),
			toSplit : new RegExp('(?:\\s+(?:-|' + ts.language.to + ')\\s+)' ,'gi'),
			andTest : new RegExp('\\s+(' + ts.language.and + '|&&)\\s+', 'i'),
			andSplit : new RegExp('(?:\\s+(?:' + ts.language.and + '|&&)\\s+)', 'gi'),
			orReplace : new RegExp('\\s+(' + ts.language.or + ')\\s+', 'gi'),
			iQuery : new RegExp(txt, 'i'),
			igQuery : new RegExp(txt, 'ig')
		});

		// don't build filter row if columnFilters is false or all columns are set to "filter-false" - issue #156
		if (wo.filter_columnFilters !== false && c.$headers.filter('.filter-false, .parser-false').length !== c.$headers.length) {
			// build filter row
			ts.filter.buildRow(table, c, wo);
		}

		txt = 'addRows updateCell update updateRows updateComplete appendCache filterReset filterEnd search '.split(' ').join(c.namespace + 'filter ');
		c.$table.bind( txt, function(event, filter) {
			val = (wo.filter_hideEmpty && $.isEmptyObject(c.cache) && !(c.delayInit && event.type === 'appendCache'));
			// hide filter row using the "filtered" class name
			c.$table.find('.' + tscss.filterRow).toggleClass(wo.filter_filteredRow, val ); // fixes #450
			if ( !/(search|filter)/.test(event.type) ) {
				event.stopPropagation();
				ts.filter.buildDefault(table, true);
			}
			if (event.type === 'filterReset') {
				c.$table.find('.' + tscss.filter).add(wo.filter_$externalFilters).val('');
				ts.filter.searching(table, []);
			} else if (event.type === 'filterEnd') {
				ts.filter.buildDefault(table, true);
			} else {
				// send false argument to force a new search; otherwise if the filter hasn't changed, it will return
				filter = event.type === 'search' ? filter : event.type === 'updateComplete' ? c.$table.data('lastSearch') : '';
				if (/(update|add)/.test(event.type) && event.type !== "updateComplete") {
					// force a new search since content has changed
					c.lastCombinedFilter = null;
					c.lastSearch = [];
				}
				// pass true (skipFirst) to prevent the tablesorter.setFilters function from skipping the first input
				// ensures all inputs are updated when a search is triggered on the table $('table').trigger('search', [...]);
				ts.filter.searching(table, filter, true);
			}
			return false;
		});

		// reset button/link
		if (wo.filter_reset) {
			if (wo.filter_reset instanceof $) {
				// reset contains a jQuery object, bind to it
				wo.filter_reset.click(function(){
					c.$table.trigger('filterReset');
				});
			} else if ($(wo.filter_reset).length) {
				// reset is a jQuery selector, use event delegation
				$(document)
				.undelegate(wo.filter_reset, 'click.tsfilter')
				.delegate(wo.filter_reset, 'click.tsfilter', function() {
					// trigger a reset event, so other functions (filter_formatter) know when to reset
					c.$table.trigger('filterReset');
				});
			}
		}
		if (wo.filter_functions) {
			for (column = 0; column < c.columns; column++) {
				fxn = ts.getColumnData( table, wo.filter_functions, column );
				if (fxn) {
					// remove "filter-select" from header otherwise the options added here are replaced with all options
					$header = c.$headerIndexed[column].removeClass('filter-select');
					// don't build select if "filter-false" or "parser-false" set
					noSelect = !($header.hasClass('filter-false') || $header.hasClass('parser-false'));
					options = '';
					if ( fxn === true && noSelect ) {
						ts.filter.buildSelect(table, column);
					} else if ( typeof fxn === 'object' && noSelect ) {
						// add custom drop down list
						for (string in fxn) {
							if (typeof string === 'string') {
								options += options === '' ?
									'<option value="">' + ($header.data('placeholder') || $header.attr('data-placeholder') || wo.filter_placeholder.select || '') + '</option>' : '';
								val = string;
								txt = string;
								if (string.indexOf(wo.filter_selectSourceSeparator) >= 0) {
									val = string.split(wo.filter_selectSourceSeparator);
									txt = val[1];
									val = val[0];
								}
								options += '<option ' + (txt === val ? '' : 'data-function-name="' + string + '" ') + 'value="' + val + '">' + txt + '</option>';
							}
						}
						c.$table.find('thead').find('select.' + tscss.filter + '[data-column="' + column + '"]').append(options);
						txt = wo.filter_selectSource;
						fxn = $.isFunction(txt) ? true : ts.getColumnData( table, txt, column );
						if (fxn) {
							// updating so the extra options are appended
							ts.filter.buildSelect(c.table, column, '', true, $header.hasClass(wo.filter_onlyAvail));
						}
					}
				}
			}
		}
		// not really updating, but if the column has both the "filter-select" class & filter_functions set to true,
		// it would append the same options twice.
		ts.filter.buildDefault(table, true);

		ts.filter.bindSearch( table, c.$table.find('.' + tscss.filter), true );
		if (wo.filter_external) {
			ts.filter.bindSearch( table, wo.filter_external );
		}

		if (wo.filter_hideFilters) {
			ts.filter.hideFilters(table, c);
		}

		// show processing icon
		if (c.showProcessing) {
			c.$table
				.unbind( ('filterStart filterEnd '.split(' ').join(c.namespace + 'filter ')).replace(/\s+/g, ' ') )
				.bind( 'filterStart filterEnd '.split(' ').join(c.namespace + 'filter '), function(event, columns) {
				// only add processing to certain columns to all columns
				$header = (columns) ? c.$table.find('.' + tscss.header).filter('[data-column]').filter(function() {
					return columns[$(this).data('column')] !== '';
				}) : '';
				ts.isProcessing(table, event.type === 'filterStart', columns ? $header : '');
			});
		}

		// set filtered rows count (intially unfiltered)
		c.filteredRows = c.totalRows;

		// add default values
		c.$table
		.unbind( ('tablesorter-initialized pagerBeforeInitialized '.split(' ').join(c.namespace + 'filter ')).replace(/\s+/g, ' ') )
		.bind( 'tablesorter-initialized pagerBeforeInitialized '.split(' ').join(c.namespace + 'filter '), function() {
			// redefine "wo" as it does not update properly inside this callback
			var wo = this.config.widgetOptions;
			filters = ts.filter.setDefaults(table, c, wo) || [];
			if (filters.length) {
				// prevent delayInit from triggering a cache build if filters are empty
				if ( !(c.delayInit && filters.join('') === '') ) {
					ts.setFilters(table, filters, true);
				}
			}
			c.$table.trigger('filterFomatterUpdate');
			// trigger init after setTimeout to prevent multiple filterStart/End/Init triggers
			setTimeout(function(){
				if (!wo.filter_initialized) {
					ts.filter.filterInitComplete(c);
				}
			}, 100);
		});
		// if filter widget is added after pager has initialized; then set filter init flag
		if (c.pager && c.pager.initialized && !wo.filter_initialized) {
			c.$table.trigger('filterFomatterUpdate');
			setTimeout(function(){
				ts.filter.filterInitComplete(c);
			}, 100);
		}
	},
	// $cell parameter, but not the config, is passed to the
	// filter_formatters, so we have to work with it instead
	formatterUpdated: function($cell, column) {
		var wo = $cell.closest('table')[0].config.widgetOptions;
		if (!wo.filter_initialized) {
			// add updates by column since this function
			// may be called numerous times before initialization
			wo.filter_formatterInit[column] = 1;
		}
	},
	filterInitComplete: function(c){
		var indx, len,
			wo = c.widgetOptions,
			count = 0,
			completed = function(){
				wo.filter_initialized = true;
				c.$table.trigger('filterInit', c);
				ts.filter.findRows(c.table, c.$table.data('lastSearch') || []);
			};
		if ( $.isEmptyObject( wo.filter_formatter ) ) {
			completed();
		} else {
			len = wo.filter_formatterInit.length;
			for (indx = 0; indx < len; indx++) {
				if (wo.filter_formatterInit[indx] === 1) {
					count++;
				}
			}
			clearTimeout(wo.filter_initTimer);
			if (!wo.filter_initialized && count === wo.filter_formatterCount) {
				// filter widget initialized
				completed();
			} else if (!wo.filter_initialized) {
				// fall back in case a filter_formatter doesn't call
				// $.tablesorter.filter.formatterUpdated($cell, column), and the count is off
				wo.filter_initTimer = setTimeout(function(){
					completed();
				}, 500);
			}
		}
	},

	setDefaults: function(table, c, wo) {
		var isArray, saved, indx, col, $filters,
			// get current (default) filters
			filters = ts.getFilters(table) || [];
		if (wo.filter_saveFilters && ts.storage) {
			saved = ts.storage( table, 'tablesorter-filters' ) || [];
			isArray = $.isArray(saved);
			// make sure we're not just getting an empty array
			if ( !(isArray && saved.join('') === '' || !isArray) ) { filters = saved; }
		}
		// if no filters saved, then check default settings
		if (filters.join('') === '') {
			// allow adding default setting to external filters
			$filters = c.$headers.add( wo.filter_$externalFilters ).filter('[' + wo.filter_defaultAttrib + ']');
			for (indx = 0; indx <= c.columns; indx++) {
				// include data-column="all" external filters
				col = indx === c.columns ? 'all' : indx;
				filters[indx] = $filters.filter('[data-column="' + col + '"]').attr(wo.filter_defaultAttrib) || filters[indx] || '';
			}
		}
		c.$table.data('lastSearch', filters);
		return filters;
	},
	parseFilter: function(c, filter, column, parsed, forceParse){
		return forceParse || parsed ?
			c.parsers[column].format( filter, c.table, [], column ) :
			filter;
	},
	buildRow: function(table, c, wo) {
		var col, column, $header, buildSelect, disabled, name, ffxn,
			// c.columns defined in computeThIndexes()
			columns = c.columns,
			arry = $.isArray(wo.filter_cellFilter),
			buildFilter = '<tr role="row" class="' + tscss.filterRow + ' ' + c.cssIgnoreRow + '">';
		for (column = 0; column < columns; column++) {
			if (arry) {
				buildFilter += '<td' + ( wo.filter_cellFilter[column] ? ' class="' + wo.filter_cellFilter[column] + '"' : '' ) + '></td>';
			} else {
				buildFilter += '<td' + ( wo.filter_cellFilter !== '' ? ' class="' + wo.filter_cellFilter + '"' : '' ) + '></td>';
			}
		}
		c.$filters = $(buildFilter += '</tr>').appendTo( c.$table.children('thead').eq(0) ).find('td');
		// build each filter input
		for (column = 0; column < columns; column++) {
			disabled = false;
			// assuming last cell of a column is the main column
			$header = c.$headerIndexed[column];
			ffxn = ts.getColumnData( table, wo.filter_functions, column );
			buildSelect = (wo.filter_functions && ffxn && typeof ffxn !== "function" ) ||
				$header.hasClass('filter-select');
			// get data from jQuery data, metadata, headers option or header class name
			col = ts.getColumnData( table, c.headers, column );
			disabled = ts.getData($header[0], col, 'filter') === 'false' || ts.getData($header[0], col, 'parser') === 'false';

			if (buildSelect) {
				buildFilter = $('<select>').appendTo( c.$filters.eq(column) );
			} else {
				ffxn = ts.getColumnData( table, wo.filter_formatter, column );
				if (ffxn) {
					wo.filter_formatterCount++;
					buildFilter = ffxn( c.$filters.eq(column), column );
					// no element returned, so lets go find it
					if (buildFilter && buildFilter.length === 0) {
						buildFilter = c.$filters.eq(column).children('input');
					}
					// element not in DOM, so lets attach it
					if ( buildFilter && (buildFilter.parent().length === 0 ||
						(buildFilter.parent().length && buildFilter.parent()[0] !== c.$filters[column])) ) {
						c.$filters.eq(column).append(buildFilter);
					}
				} else {
					buildFilter = $('<input type="search">').appendTo( c.$filters.eq(column) );
				}
				if (buildFilter) {
					buildFilter.attr('placeholder', $header.data('placeholder') || $header.attr('data-placeholder') || wo.filter_placeholder.search || '');
				}
			}
			if (buildFilter) {
				// add filter class name
				name = ( $.isArray(wo.filter_cssFilter) ?
					(typeof wo.filter_cssFilter[column] !== 'undefined' ? wo.filter_cssFilter[column] || '' : '') :
					wo.filter_cssFilter ) || '';
				buildFilter.addClass( tscss.filter + ' ' + name ).attr('data-column', column);
				if (disabled) {
					buildFilter.attr('placeholder', '').addClass(tscss.filterDisabled)[0].disabled = true; // disabled!
				}
			}
		}
	},
	bindSearch: function(table, $el, internal) {
		table = $(table)[0];
		$el = $($el); // allow passing a selector string
		if (!$el.length) { return; }
		var c = table.config,
			wo = c.widgetOptions,
			$ext = wo.filter_$externalFilters;
		if (internal !== true) {
			// save anyMatch element
			wo.filter_$anyMatch = $el.filter(wo.filter_anyColumnSelector + ',' + wo.filter_multipleColumnSelector);
			if ($ext && $ext.length) {
				wo.filter_$externalFilters = wo.filter_$externalFilters.add( $el );
			} else {
				wo.filter_$externalFilters = $el;
			}
			// update values (external filters added after table initialization)
			ts.setFilters(table, c.$table.data('lastSearch') || [], internal === false);
		}
		$el
		// use data attribute instead of jQuery data since the head is cloned without including the data/binding
		.attr('data-lastSearchTime', new Date().getTime())
		.unbind( ('keypress keyup search change '.split(' ').join(c.namespace + 'filter ')).replace(/\s+/g, ' ') )
		// include change for select - fixes #473
		.bind('keyup' + c.namespace + 'filter', function(event) {
			$(this).attr('data-lastSearchTime', new Date().getTime());
			// emulate what webkit does.... escape clears the filter
			if (event.which === 27) {
				this.value = '';
			// live search
			} else if ( wo.filter_liveSearch === false ) {
				return;
				// don't return if the search value is empty (all rows need to be revealed)
			} else if ( this.value !== '' && (
				// liveSearch can contain a min value length; ignore arrow and meta keys, but allow backspace
				( typeof wo.filter_liveSearch === 'number' && this.value.length < wo.filter_liveSearch ) ||
				// let return & backspace continue on, but ignore arrows & non-valid characters
				( event.which !== 13 && event.which !== 8 && ( event.which < 32 || (event.which >= 37 && event.which <= 40) ) ) ) ) {
				return;
			}
			// change event = no delay; last true flag tells getFilters to skip newest timed input
			ts.filter.searching( table, true, true );
		})
		.bind( 'search change keypress '.split(' ').join(c.namespace + 'filter '), function(event){
			var column = $(this).data('column');
			// don't allow "change" event to process if the input value is the same - fixes #685
			if (event.which === 13 || event.type === 'search' || event.type === 'change' && this.value !== c.lastSearch[column]) {
				event.preventDefault();
				// init search with no delay
				$(this).attr('data-lastSearchTime', new Date().getTime());
				ts.filter.searching( table, false, true );
			}
		});
	},
	searching: function(table, filter, skipFirst) {
		var wo = table.config.widgetOptions;
		clearTimeout(wo.searchTimer);
		if (typeof filter === 'undefined' || filter === true) {
			// delay filtering
			wo.searchTimer = setTimeout(function() {
				ts.filter.checkFilters(table, filter, skipFirst );
			}, wo.filter_liveSearch ? wo.filter_searchDelay : 10);
		} else {
			// skip delay
			ts.filter.checkFilters(table, filter, skipFirst);
		}
	},
	checkFilters: function(table, filter, skipFirst) {
		var c = table.config,
			wo = c.widgetOptions,
			filterArray = $.isArray(filter),
			filters = (filterArray) ? filter : ts.getFilters(table, true),
			combinedFilters = (filters || []).join(''); // combined filter values
		// prevent errors if delay init is set
		if ($.isEmptyObject(c.cache)) {
			// update cache if delayInit set & pager has initialized (after user initiates a search)
			if (c.delayInit && c.pager && c.pager.initialized) {
				c.$table.trigger('updateCache', [function(){
					ts.filter.checkFilters(table, false, skipFirst);
				}] );
			}
			return;
		}
		// add filter array back into inputs
		if (filterArray) {
			ts.setFilters( table, filters, false, skipFirst !== true );
			if (!wo.filter_initialized) { c.lastCombinedFilter = ''; }
		}
		if (wo.filter_hideFilters) {
			// show/hide filter row as needed
			c.$table.find('.' + tscss.filterRow).trigger( combinedFilters === '' ? 'mouseleave' : 'mouseenter' );
		}
		// return if the last search is the same; but filter === false when updating the search
		// see example-widget-filter.html filter toggle buttons
		if (c.lastCombinedFilter === combinedFilters && filter !== false) {
			return;
		} else if (filter === false) {
			// force filter refresh
			c.lastCombinedFilter = null;
			c.lastSearch = [];
		}
		if (wo.filter_initialized) { c.$table.trigger('filterStart', [filters]); }
		if (c.showProcessing) {
			// give it time for the processing icon to kick in
			setTimeout(function() {
				ts.filter.findRows(table, filters, combinedFilters);
				return false;
			}, 30);
		} else {
			ts.filter.findRows(table, filters, combinedFilters);
			return false;
		}
	},
	hideFilters: function(table, c) {
		var $filterRow, $filterRow2, timer;
		$(table)
			.find('.' + tscss.filterRow)
			.addClass(tscss.filterRowHide)
			.bind('mouseenter mouseleave', function(e) {
				// save event object - http://bugs.jquery.com/ticket/12140
				var event = e;
				$filterRow = $(this);
				clearTimeout(timer);
				timer = setTimeout(function() {
					if ( /enter|over/.test(event.type) ) {
						$filterRow.removeClass(tscss.filterRowHide);
					} else {
						// don't hide if input has focus
						// $(':focus') needs jQuery 1.6+
						if ( $(document.activeElement).closest('tr')[0] !== $filterRow[0] ) {
							// don't hide row if any filter has a value
							if (c.lastCombinedFilter === '') {
								$filterRow.addClass(tscss.filterRowHide);
							}
						}
					}
				}, 200);
			})
			.find('input, select').bind('focus blur', function(e) {
				$filterRow2 = $(this).closest('tr');
				clearTimeout(timer);
				var event = e;
				timer = setTimeout(function() {
					// don't hide row if any filter has a value
					if (ts.getFilters(c.$table).join('') === '') {
						$filterRow2[ event.type === 'focus' ? 'removeClass' : 'addClass'](tscss.filterRowHide);
					}
				}, 200);
			});
	},
	defaultFilter: function(filter, mask){
		if (filter === '') { return filter; }
		var regex = ts.filter.regex.iQuery,
			maskLen = mask.match( ts.filter.regex.igQuery ).length,
			query = maskLen > 1 ? $.trim(filter).split(/\s/) : [ $.trim(filter) ],
			len = query.length - 1,
			indx = 0,
			val = mask;
		if ( len < 1 && maskLen > 1 ) {
			// only one "word" in query but mask has >1 slots
			query[1] = query[0];
		}
		// replace all {query} with query words...
		// if query = "Bob", then convert mask from "!{query}" to "!Bob"
		// if query = "Bob Joe Frank", then convert mask "{q} OR {q}" to "Bob OR Joe OR Frank"
		while (regex.test(val)) {
			val = val.replace(regex, query[indx++] || '');
			if (regex.test(val) && indx < len && (query[indx] || '') !== '') {
				val = mask.replace(regex, val);
			}
		}
		return val;
	},
	getLatestSearch: function( $input ) {
		if ($input) {
			return $input.sort(function(a, b) {
				return $(b).attr('data-lastSearchTime') - $(a).attr('data-lastSearchTime');
			});
		}
		return $();
	},
	multipleColumns: function( c, $input ) {
		// look for multiple columns "1-3,4-6,8" in data-column
		var temp, ranges, range, start, end, singles, i, indx, len,
			wo = c.widgetOptions,
			// only target "all" column inputs on initialization
			// & don't target "all" column inputs if they don't exist
			targets = wo.filter_initialized || !$input.filter(wo.filter_anyColumnSelector).length,
			columns = [],
			val = $.trim( ts.filter.getLatestSearch( $input ).attr('data-column') || '' );
		// process column range
		if ( targets && /-/.test( val ) ) {
			ranges = val.match( /(\d+)\s*-\s*(\d+)/g );
			len = ranges.length;
			for (indx = 0; indx < len; indx++) {
				range = ranges[indx].split( /\s*-\s*/ );
				start = parseInt( range[0], 10 ) || 0;
				end = parseInt( range[1], 10 ) || ( c.columns - 1 );
				if ( start > end ) { temp = start; start = end; end = temp; } // swap
				if ( end >= c.columns ) { end = c.columns - 1; }
				for ( ; start <= end; start++ ) {
					columns.push(start);
				}
				// remove processed range from val
				val = val.replace( ranges[indx], '' );
			}
		}
		// process single columns
		if ( targets && /,/.test( val ) ) {
			singles = val.split( /\s*,\s*/ );
			len = singles.length;
			for (i = 0; i < len; i++) {
				if (singles[i] !== '') {
					indx = parseInt( singles[i], 10 );
					if ( indx < c.columns ) {
						columns.push( indx );
					}
				}
			}
		}
		// return all columns
		if (!columns.length) {
			for ( indx = 0; indx < c.columns; indx++ ) {
				columns.push( indx );
			}
		}
		return columns;
	},
	findRows: function(table, filters, combinedFilters) {
		if (table.config.lastCombinedFilter === combinedFilters || !table.config.widgetOptions.filter_initialized) { return; }
		var len, norm_rows, $rows, rowIndex, tbodyIndex, $tbody, $cells, $cell, columnIndex,
			childRow, lastSearch, hasSelect, matches, result, showRow, time, val, indx,
			notFiltered, searchFiltered, filterMatched, excludeMatch, fxn, ffxn,
			query, injected, res, id,
			regex = ts.filter.regex,
			c = table.config,
			wo = c.widgetOptions,
			// data object passed to filters; anyMatch is a flag for the filters
			data = { anyMatch: false },
			// anyMatch really screws up with these types of filters
			noAnyMatch = [ 'range', 'notMatch',  'operators' ];

		// parse columns after formatter, in case the class is added at that point
		data.parsed = c.$headers.map(function(columnIndex) {
			return c.parsers && c.parsers[columnIndex] && c.parsers[columnIndex].parsed ||
				// getData won't return "parsed" if other "filter-" class names exist (e.g. <th class="filter-select filter-parsed">)
				ts.getData && ts.getData(c.$headerIndexed[columnIndex], ts.getColumnData( table, c.headers, columnIndex ), 'filter') === 'parsed' ||
				$(this).hasClass('filter-parsed');
		}).get();

		// cache filter variables that use ts.getColumnData in the main loop
		wo.filter_indexed = {
			functions : [],
			excludeFilter : [],
			defaultColFilter : [],
			defaultAnyFilter : ts.getColumnData( table, wo.filter_defaultFilter, c.columns, true ) || ''
		};
		for ( columnIndex = 0; columnIndex < c.columns; columnIndex++ ) {
			wo.filter_indexed.functions[ columnIndex ] = ts.getColumnData( table, wo.filter_functions, columnIndex );
			wo.filter_indexed.defaultColFilter[ columnIndex ] = ts.getColumnData( table, wo.filter_defaultFilter, columnIndex ) || '';
			wo.filter_indexed.excludeFilter[ columnIndex ] = ( ts.getColumnData( table, wo.filter_excludeFilter, columnIndex, true ) || '' ).split(/\s+/);
		}

		if (c.debug) {
			ts.log('Filter: Starting filter widget search', filters);
			time = new Date();
		}
		// filtered rows count
		c.filteredRows = 0;
		c.totalRows = 0;
		// combindedFilters are undefined on init
		combinedFilters = (filters || []).join('');

		for (tbodyIndex = 0; tbodyIndex < c.$tbodies.length; tbodyIndex++ ) {
			$tbody = ts.processTbody(table, c.$tbodies.eq(tbodyIndex), true);
			// skip child rows & widget added (removable) rows - fixes #448 thanks to @hempel!
			// $rows = $tbody.children('tr').not(c.selectorRemove);
			columnIndex = c.columns;
			// convert stored rows into a jQuery object
			norm_rows = c.cache[tbodyIndex].normalized;
			$rows = $( $.map(norm_rows, function(el){ return el[columnIndex].$row.get(); }) );

			if (combinedFilters === '' || wo.filter_serversideFiltering) {
				$rows.removeClass(wo.filter_filteredRow).not('.' + c.cssChildRow).css('display', '');
			} else {
				// filter out child rows
				$rows = $rows.not('.' + c.cssChildRow);
				len = $rows.length;

				if ( (wo.filter_$anyMatch && wo.filter_$anyMatch.length) || typeof filters[c.columns] !== 'undefined' ) {
					data.anyMatchFlag = true;
					data.anyMatchFilter = wo.filter_$anyMatch && ts.filter.getLatestSearch( wo.filter_$anyMatch ).val() || ( '' + filters[c.columns] ) || '';
					if (wo.filter_columnAnyMatch) {
						// specific columns search
						query = data.anyMatchFilter.split( ts.filter.regex.andSplit );
						injected = false;
						for (indx = 0; indx < query.length; indx++) {
							res = query[indx].split(':');
							if ( res.length > 1 ) {
								// make the column a one-based index ( non-developers start counting from one :P )
								id = parseInt( res[0], 10 ) - 1;
								if ( id >= 0 && id < c.columns ) { // if id is an integer
									filters[id] = res[1];
									query.splice(indx, 1);
									indx--;
									injected = true;
								}
							}
						}
						if (injected) {
							data.anyMatchFilter = query.join(' && ');
						}
					}
				}

				// optimize searching only through already filtered rows - see #313
				searchFiltered = wo.filter_searchFiltered;
				lastSearch = c.lastSearch || c.$table.data('lastSearch') || [];
				if (searchFiltered) {
					// cycle through all filters; include last (columnIndex + 1 = match any column). Fixes #669
					for (indx = 0; indx < columnIndex + 1; indx++) {
						val = filters[indx] || '';
						// break out of loop if we've already determined not to search filtered rows
						if (!searchFiltered) { indx = columnIndex; }
						// search already filtered rows if...
						searchFiltered = searchFiltered && lastSearch.length &&
							// there are no changes from beginning of filter
							val.indexOf(lastSearch[indx] || '') === 0 &&
							// if there is NOT a logical "or", or range ("to" or "-") in the string
							!regex.alreadyFiltered.test(val) &&
							// if we are not doing exact matches, using "|" (logical or) or not "!"
							!/[=\"\|!]/.test(val) &&
							// don't search only filtered if the value is negative ('> -10' => '> -100' will ignore hidden rows)
							!(/(>=?\s*-\d)/.test(val) || /(<=?\s*\d)/.test(val)) &&
							// if filtering using a select without a "filter-match" class (exact match) - fixes #593
							!( val !== '' && c.$filters && c.$filters.eq(indx).find('select').length && !c.$headerIndexed[indx].hasClass('filter-match') );
					}
				}
				notFiltered = $rows.not('.' + wo.filter_filteredRow).length;
				// can't search when all rows are hidden - this happens when looking for exact matches
				if (searchFiltered && notFiltered === 0) { searchFiltered = false; }
				if (c.debug) {
					ts.log( 'Filter: Searching through ' + ( searchFiltered && notFiltered < len ? notFiltered : 'all' ) + ' rows' );
				}
				if (data.anyMatchFlag) {
					if (c.sortLocaleCompare) {
						// replace accents
						data.anyMatchFilter = ts.replaceAccents(data.anyMatchFilter);
					}
					if ( wo.filter_defaultFilter && regex.iQuery.test( wo.filter_indexed.defaultAnyFilter ) ) {
						data.anyMatchFilter = ts.filter.defaultFilter( data.anyMatchFilter, wo.filter_indexed.defaultAnyFilter );
						// clear search filtered flag because default filters are not saved to the last search
						searchFiltered = false;
					}
					// make iAnyMatchFilter lowercase unless both filter widget & core ignoreCase options are true
					// when c.ignoreCase is true, the cache contains all lower case data
					data.iAnyMatchFilter = !(wo.filter_ignoreCase && c.ignoreCase) ? data.anyMatchFilter : data.anyMatchFilter.toLocaleLowerCase();
				}

				// loop through the rows
				for (rowIndex = 0; rowIndex < len; rowIndex++) {

					data.cacheArray = norm_rows[rowIndex];

					childRow = $rows[rowIndex].className;
					// skip child rows & already filtered rows
					if ( regex.child.test(childRow) || (searchFiltered && regex.filtered.test(childRow)) ) { continue; }
					showRow = true;
					// *** nextAll/nextUntil not supported by Zepto! ***
					childRow = $rows.eq(rowIndex).nextUntil('tr:not(.' + c.cssChildRow + ')');
					// so, if "table.config.widgetOptions.filter_childRows" is true and there is
					// a match anywhere in the child row, then it will make the row visible
					// checked here so the option can be changed dynamically
					data.childRowText = (childRow.length && wo.filter_childRows) ? childRow.text() : '';
					data.childRowText = wo.filter_ignoreCase ? data.childRowText.toLocaleLowerCase() : data.childRowText;
					$cells = $rows.eq(rowIndex).children();
					if (data.anyMatchFlag) {
						// look for multiple columns "1-3,4-6,8"
						columnIndex = ts.filter.multipleColumns( c, wo.filter_$anyMatch );
						data.anyMatch = true;
						data.rowArray = $cells.map(function(i){
							if ( $.inArray(i, columnIndex) > -1 ) {
								var txt;
								if (data.parsed[i]) {
									txt = data.cacheArray[i];
								} else {
									txt = this ? this.getAttribute( c.textAttribute ) || this.textContent || $(this).text() : '';
									txt = $.trim( wo.filter_ignoreCase ? txt.toLowerCase() : txt );
									if (c.sortLocaleCompare) {
										txt = ts.replaceAccents(txt);
									}
								}
								return txt;
							}
						}).get();
						data.filter = data.anyMatchFilter;
						data.iFilter = data.iAnyMatchFilter;
						data.exact = data.rowArray.join(' ');
						data.iExact = wo.filter_ignoreCase ? data.exact.toLowerCase() : data.exact;
						data.cache = data.cacheArray.slice(0,-1).join(' ');
						filterMatched = null;
						$.each(ts.filter.types, function(type, typeFunction) {
							if ($.inArray(type, noAnyMatch) < 0) {
								matches = typeFunction( c, data );
								if (matches !== null) {
									filterMatched = matches;
									return false;
								}
							}
						});
						if (filterMatched !== null) {
							showRow = filterMatched;
						} else {
							if (wo.filter_startsWith) {
								showRow = false;
								columnIndex = c.columns;
								while (!showRow && columnIndex > 0) {
									columnIndex--;
									showRow = showRow || data.rowArray[columnIndex].indexOf(data.iFilter) === 0;
								}
							} else {
								showRow = (data.iExact + data.childRowText).indexOf(data.iFilter) >= 0;
							}
						}
						data.anyMatch = false;
					}

					for (columnIndex = 0; columnIndex < c.columns; columnIndex++) {
						data.filter = filters[columnIndex];
						data.index = columnIndex;

						// filter types to exclude, per column
						excludeMatch = wo.filter_indexed.excludeFilter[ columnIndex ];

						// ignore if filter is empty or disabled
						if (data.filter) {
							data.cache = data.cacheArray[columnIndex];
							// check if column data should be from the cell or from parsed data
							if (wo.filter_useParsedData || data.parsed[columnIndex]) {
								data.exact = data.cache;
							} else {
								val = $cells[columnIndex];
								result = val ? $.trim( val.getAttribute( c.textAttribute ) || val.textContent || $cells.eq(columnIndex).text() ) : '';
								data.exact = c.sortLocaleCompare ? ts.replaceAccents(result) : result; // issue #405
							}
							data.iExact = !regex.type.test(typeof data.exact) && wo.filter_ignoreCase ? data.exact.toLocaleLowerCase() : data.exact;
							result = showRow; // if showRow is true, show that row

							// in case select filter option has a different value vs text "a - z|A through Z"
							ffxn = wo.filter_columnFilters ?
								c.$filters.add(c.$externalFilters).filter('[data-column="'+ columnIndex + '"]').find('select option:selected').attr('data-function-name') || '' : '';
							// replace accents - see #357
							if (c.sortLocaleCompare) {
								data.filter = ts.replaceAccents(data.filter);
							}

							val = true;
							if (wo.filter_defaultFilter && regex.iQuery.test( wo.filter_indexed.defaultColFilter[ columnIndex ] )) {
								data.filter = ts.filter.defaultFilter( data.filter, wo.filter_indexed.defaultColFilter[ columnIndex ] );
								// val is used to indicate that a filter select is using a default filter; so we override the exact & partial matches
								val = false;
							}
							// data.iFilter = case insensitive (if wo.filter_ignoreCase is true), data.filter = case sensitive
							data.iFilter = wo.filter_ignoreCase ? (data.filter || '').toLocaleLowerCase() : data.filter;
							fxn = wo.filter_indexed.functions[ columnIndex ];
							$cell = c.$headerIndexed[columnIndex];
							hasSelect = $cell.hasClass('filter-select');
							filterMatched = null;
							if ( fxn || ( hasSelect && val ) ) {
								if (fxn === true || hasSelect) {
									// default selector uses exact match unless "filter-match" class is found
									filterMatched = ($cell.hasClass('filter-match')) ? data.iExact.search(data.iFilter) >= 0 : data.filter === data.exact;
								} else if (typeof fxn === 'function') {
									// filter callback( exact cell content, parser normalized content, filter input value, column index, jQuery row object )
									filterMatched = fxn(data.exact, data.cache, data.filter, columnIndex, $rows.eq(rowIndex), c);
								} else if (typeof fxn[ffxn || data.filter] === 'function') {
									// selector option function
									filterMatched = fxn[ffxn || data.filter](data.exact, data.cache, data.filter, columnIndex, $rows.eq(rowIndex), c);
								}
							}
							if (filterMatched === null) {
								// cycle through the different filters
								// filters return a boolean or null if nothing matches
								$.each(ts.filter.types, function(type, typeFunction) {
									if ($.inArray(type, excludeMatch) < 0) {
										matches = typeFunction( c, data );
										if (matches !== null) {
											filterMatched = matches;
											return false;
										}
									}
								});
								if (filterMatched !== null) {
									result = filterMatched;
								// Look for match, and add child row data for matching
								} else {
									data.exact = (data.iExact + data.childRowText).indexOf( ts.filter.parseFilter(c, data.iFilter, columnIndex, data.parsed[columnIndex]) );
									result = ( (!wo.filter_startsWith && data.exact >= 0) || (wo.filter_startsWith && data.exact === 0) );
								}
							} else {
								result = filterMatched;
							}
							showRow = (result) ? showRow : false;
						}
					}
					$rows.eq(rowIndex)
						.toggleClass(wo.filter_filteredRow, !showRow)[0]
						.display = showRow ? '' : 'none';
					if (childRow.length) {
						childRow.toggleClass(wo.filter_filteredRow, !showRow);
					}
				}
			}
			c.filteredRows += $rows.not('.' + wo.filter_filteredRow).length;
			c.totalRows += $rows.length;
			ts.processTbody(table, $tbody, false);
		}
		c.lastCombinedFilter = combinedFilters; // save last search
		c.lastSearch = filters;
		c.$table.data('lastSearch', filters);
		if (wo.filter_saveFilters && ts.storage) {
			ts.storage( table, 'tablesorter-filters', filters );
		}
		if (c.debug) {
			ts.benchmark("Completed filter widget search", time);
		}
		if (wo.filter_initialized) { c.$table.trigger('filterEnd', c ); }
		setTimeout(function(){
			c.$table.trigger('applyWidgets'); // make sure zebra widget is applied
		}, 0);
	},
	getOptionSource: function(table, column, onlyAvail) {
		table = $(table)[0];
		var cts, indx, len,
			c = table.config,
			wo = c.widgetOptions,
			parsed = [],
			arry = false,
			source = wo.filter_selectSource,
			last = c.$table.data('lastSearch') || [],
			fxn = $.isFunction(source) ? true : ts.getColumnData( table, source, column );

		if (onlyAvail && last[column] !== '') {
			onlyAvail = false;
		}

		// filter select source option
		if (fxn === true) {
			// OVERALL source
			arry = source(table, column, onlyAvail);
		} else if ( fxn instanceof $ || ($.type(fxn) === 'string' && fxn.indexOf('</option>') >= 0) ) {
			// selectSource is a jQuery object or string of options
			return fxn;
		} else if ($.isArray(fxn)) {
			arry = fxn;
		} else if ($.type(source) === 'object' && fxn) {
			// custom select source function for a SPECIFIC COLUMN
			arry = fxn(table, column, onlyAvail);
		}
		if (arry === false) {
			// fall back to original method
			arry = ts.filter.getOptions(table, column, onlyAvail);
		}

		// get unique elements and sort the list
		// if $.tablesorter.sortText exists (not in the original tablesorter),
		// then natural sort the list otherwise use a basic sort
		arry = $.grep(arry, function(value, indx) {
			return $.inArray(value, arry) === indx;
		});

		if (c.$headerIndexed[column].hasClass('filter-select-nosort')) {
			// unsorted select options
			return arry;
		} else {
			len = arry.length;
			// parse select option values
			for (indx = 0; indx < len; indx++) {
				// parse array data using set column parser; this DOES NOT pass the original
				// table cell to the parser format function
				parsed.push({ t : arry[indx], p : c.parsers && c.parsers[column].format( arry[indx], table, [], column ) });
			}

			// sort parsed select options
			cts = c.textSorter || '';
			parsed.sort(function(a, b){
				// sortNatural breaks if you don't pass it strings
				var x = a.p.toString(), y = b.p.toString();
				if ($.isFunction(cts)) {
					// custom OVERALL text sorter
					return cts(x, y, true, column, table);
				} else if (typeof(cts) === 'object' && cts.hasOwnProperty(column)) {
					// custom text sorter for a SPECIFIC COLUMN
					return cts[column](x, y, true, column, table);
				} else if (ts.sortNatural) {
					// fall back to natural sort
					return ts.sortNatural(x, y);
				}
				// using an older version! do a basic sort
				return true;
			});
			// rebuild arry from sorted parsed data
			arry = [];
			len = parsed.length;
			for (indx = 0; indx < len; indx++) {
				arry.push( parsed[indx].t );
			}
			return arry;
		}
	},
	getOptions: function(table, column, onlyAvail) {
		table = $(table)[0];
		var rowIndex, tbodyIndex, len, row, cache, cell,
			c = table.config,
			wo = c.widgetOptions,
			arry = [];
		for (tbodyIndex = 0; tbodyIndex < c.$tbodies.length; tbodyIndex++ ) {
			cache = c.cache[tbodyIndex];
			len = c.cache[tbodyIndex].normalized.length;
			// loop through the rows
			for (rowIndex = 0; rowIndex < len; rowIndex++) {
				// get cached row from cache.row (old) or row data object (new; last item in normalized array)
				row = cache.row ? cache.row[rowIndex] : cache.normalized[rowIndex][c.columns].$row[0];
				// check if has class filtered
				if (onlyAvail && row.className.match(wo.filter_filteredRow)) { continue; }
				// get non-normalized cell content
				if (wo.filter_useParsedData || c.parsers[column].parsed || c.$headerIndexed[column].hasClass('filter-parsed')) {
					arry.push( '' + cache.normalized[rowIndex][column] );
				} else {
					cell = row.cells[column];
					if (cell) {
						arry.push( $.trim( cell.getAttribute( c.textAttribute ) || cell.textContent || $(cell).text() ) );
					}
				}
			}
		}
		return arry;
	},
	buildSelect: function(table, column, arry, updating, onlyAvail) {
		table = $(table)[0];
		column = parseInt(column, 10);
		if (!table.config.cache || $.isEmptyObject(table.config.cache)) { return; }
		var indx, val, txt, t, $filters, $filter,
			c = table.config,
			wo = c.widgetOptions,
			node = c.$headerIndexed[column],
			// t.data('placeholder') won't work in jQuery older than 1.4.3
			options = '<option value="">' + ( node.data('placeholder') || node.attr('data-placeholder') || wo.filter_placeholder.select || '' ) + '</option>',
			// Get curent filter value
			currentValue = c.$table.find('thead').find('select.' + tscss.filter + '[data-column="' + column + '"]').val();
		// nothing included in arry (external source), so get the options from filter_selectSource or column data
		if (typeof arry === 'undefined' || arry === '') {
			arry = ts.filter.getOptionSource(table, column, onlyAvail);
		}

		if ($.isArray(arry)) {
			// build option list
			for (indx = 0; indx < arry.length; indx++) {
				txt = arry[indx] = ('' + arry[indx]).replace(/\"/g, "&quot;");
				val = txt;
				// allow including a symbol in the selectSource array
				// "a-z|A through Z" so that "a-z" becomes the option value
				// and "A through Z" becomes the option text
				if (txt.indexOf(wo.filter_selectSourceSeparator) >= 0) {
					t = txt.split(wo.filter_selectSourceSeparator);
					val = t[0];
					txt = t[1];
				}
				// replace quotes - fixes #242 & ignore empty strings - see http://stackoverflow.com/q/14990971/145346
				options += arry[indx] !== '' ? '<option ' + (val === txt ? '' : 'data-function-name="' + arry[indx] + '" ') + 'value="' + val + '">' + txt + '</option>' : '';
			}
			// clear arry so it doesn't get appended twice
			arry = [];
		}

		// update all selects in the same column (clone thead in sticky headers & any external selects) - fixes 473
		$filters = ( c.$filters ? c.$filters : c.$table.children('thead') ).find('.' + tscss.filter);
		if (wo.filter_$externalFilters) {
			$filters = $filters && $filters.length ? $filters.add(wo.filter_$externalFilters) : wo.filter_$externalFilters;
		}
		$filter = $filters.filter('select[data-column="' + column + '"]');

		// make sure there is a select there!
		if ($filter.length) {
			$filter[ updating ? 'html' : 'append' ](options);
			if (!$.isArray(arry)) {
				// append options if arry is provided externally as a string or jQuery object
				// options (default value) was already added
				$filter.append(arry).val(currentValue);
			}
			$filter.val(currentValue);
		}
	},
	buildDefault: function(table, updating) {
		var columnIndex, $header, noSelect,
			c = table.config,
			wo = c.widgetOptions,
			columns = c.columns;
		// build default select dropdown
		for (columnIndex = 0; columnIndex < columns; columnIndex++) {
			$header = c.$headerIndexed[columnIndex];
			noSelect = !($header.hasClass('filter-false') || $header.hasClass('parser-false'));
			// look for the filter-select class; build/update it if found
			if (($header.hasClass('filter-select') || ts.getColumnData( table, wo.filter_functions, columnIndex ) === true) && noSelect) {
				ts.filter.buildSelect(table, columnIndex, '', updating, $header.hasClass(wo.filter_onlyAvail));
			}
		}
	}
};

ts.getFilters = function(table, getRaw, setFilters, skipFirst) {
	var i, $filters, $column, cols,
		filters = false,
		c = table ? $(table)[0].config : '',
		wo = c ? c.widgetOptions : '';
	if (getRaw !== true && wo && !wo.filter_columnFilters) {
		return $(table).data('lastSearch');
	}
	if (c) {
		if (c.$filters) {
			$filters = c.$filters.find('.' + tscss.filter);
		}
		if (wo.filter_$externalFilters) {
			$filters = $filters && $filters.length ? $filters.add(wo.filter_$externalFilters) : wo.filter_$externalFilters;
		}
		if ($filters && $filters.length) {
			filters = setFilters || [];
			for (i = 0; i < c.columns + 1; i++) {
				cols = ( i === c.columns ?
					// "all" columns can now include a range or set of columms (data-column="0-2,4,6-7")
					wo.filter_anyColumnSelector + ',' + wo.filter_multipleColumnSelector :
					'[data-column="' + i + '"]' );
				$column = $filters.filter(cols);
				if ($column.length) {
					// move the latest search to the first slot in the array
					$column = ts.filter.getLatestSearch( $column );
					if ($.isArray(setFilters)) {
						// skip first (latest input) to maintain cursor position while typing
						if (skipFirst) { $column.slice(1); }
						if (i === c.columns) {
							// prevent data-column="all" from filling data-column="0,1" (etc)
							cols = $column.filter(wo.filter_anyColumnSelector);
							$column = cols.length ? cols : $column;
						}
						$column
							.val( setFilters[i] )
							.trigger('change.tsfilter');
					} else {
						filters[i] = $column.val() || '';
						// don't change the first... it will move the cursor
						if (i === c.columns) {
							// don't update range columns from "all" setting
							$column.slice(1).filter('[data-column*="' + $column.attr('data-column') + '"]').val( filters[i] );
						} else {
							$column.slice(1).val( filters[i] );
						}
					}
					// save any match input dynamically
					if (i === c.columns && $column.length) {
						wo.filter_$anyMatch = $column;
					}
				}
			}
		}
	}
	if (filters.length === 0) {
		filters = false;
	}
	return filters;
};

ts.setFilters = function(table, filter, apply, skipFirst) {
	var c = table ? $(table)[0].config : '',
		valid = ts.getFilters(table, true, filter, skipFirst);
	if (c && apply) {
		// ensure new set filters are applied, even if the search is the same
		c.lastCombinedFilter = null;
		c.lastSearch = [];
		ts.filter.searching(c.table, filter, skipFirst);
		c.$table.trigger('filterFomatterUpdate');
	}
	return !!valid;
};

})(jQuery);

/*! Widget: stickyHeaders - updated 3/26/2015 (v2.21.3) *//*
 * Requires tablesorter v2.8+ and jQuery 1.4.3+
 * by Rob Garrison
 */
;(function ($, window) {
'use strict';
var ts = $.tablesorter = $.tablesorter || {};

$.extend(ts.css, {
	sticky    : 'tablesorter-stickyHeader', // stickyHeader
	stickyVis : 'tablesorter-sticky-visible',
	stickyHide: 'tablesorter-sticky-hidden',
	stickyWrap: 'tablesorter-sticky-wrapper'
});

// Add a resize event to table headers
ts.addHeaderResizeEvent = function(table, disable, settings) {
	table = $(table)[0]; // make sure we're using a dom element
	var headers,
		defaults = {
			timer : 250
		},
		options = $.extend({}, defaults, settings),
		c = table.config,
		wo = c.widgetOptions,
		checkSizes = function(triggerEvent) {
			wo.resize_flag = true;
			headers = [];
			c.$headers.each(function() {
				var $header = $(this),
					sizes = $header.data('savedSizes') || [0,0], // fixes #394
					width = this.offsetWidth,
					height = this.offsetHeight;
				if (width !== sizes[0] || height !== sizes[1]) {
					$header.data('savedSizes', [ width, height ]);
					headers.push(this);
				}
			});
			if (headers.length && triggerEvent !== false) {
				c.$table.trigger('resize', [ headers ]);
			}
			wo.resize_flag = false;
		};
	checkSizes(false);
	clearInterval(wo.resize_timer);
	if (disable) {
		wo.resize_flag = false;
		return false;
	}
	wo.resize_timer = setInterval(function() {
		if (wo.resize_flag) { return; }
		checkSizes();
	}, options.timer);
};

// Sticky headers based on this awesome article:
// http://css-tricks.com/13465-persistent-headers/
// and https://github.com/jmosbech/StickyTableHeaders by Jonas Mosbech
// **************************
ts.addWidget({
	id: "stickyHeaders",
	priority: 60, // sticky widget must be initialized after the filter widget!
	options: {
		stickyHeaders : '',       // extra class name added to the sticky header row
		stickyHeaders_attachTo : null, // jQuery selector or object to attach sticky header to
		stickyHeaders_xScroll : null, // jQuery selector or object to monitor horizontal scroll position (defaults: xScroll > attachTo > window)
		stickyHeaders_yScroll : null, // jQuery selector or object to monitor vertical scroll position (defaults: yScroll > attachTo > window)
		stickyHeaders_offset : 0, // number or jquery selector targeting the position:fixed element
		stickyHeaders_filteredToTop: true, // scroll table top into view after filtering
		stickyHeaders_cloneId : '-sticky', // added to table ID, if it exists
		stickyHeaders_addResizeEvent : true, // trigger "resize" event on headers
		stickyHeaders_includeCaption : true, // if false and a caption exist, it won't be included in the sticky header
		stickyHeaders_zIndex : 2 // The zIndex of the stickyHeaders, allows the user to adjust this to their needs
	},
	format: function(table, c, wo) {
		// filter widget doesn't initialize on an empty table. Fixes #449
		if ( c.$table.hasClass('hasStickyHeaders') || ($.inArray('filter', c.widgets) >= 0 && !c.$table.hasClass('hasFilters')) ) {
			return;
		}
		var $table = c.$table,
			// add position: relative to attach element, hopefully it won't cause trouble.
			$attach = $(wo.stickyHeaders_attachTo),
			namespace = c.namespace + 'stickyheaders ',
			// element to watch for the scroll event
			$yScroll = $(wo.stickyHeaders_yScroll || wo.stickyHeaders_attachTo || window),
			$xScroll = $(wo.stickyHeaders_xScroll || wo.stickyHeaders_attachTo || window),
			$thead = $table.children('thead:first'),
			$header = $thead.children('tr').not('.sticky-false').children(),
			$tfoot = $table.children('tfoot'),
			$stickyOffset = isNaN(wo.stickyHeaders_offset) ? $(wo.stickyHeaders_offset) : '',
			stickyOffset = $stickyOffset.length ? $stickyOffset.height() || 0 : parseInt(wo.stickyHeaders_offset, 10) || 0,
			// is this table nested? If so, find parent sticky header wrapper (div, not table)
			$nestedSticky = $table.parent().closest('.' + ts.css.table).hasClass('hasStickyHeaders') ?
				$table.parent().closest('table.tablesorter')[0].config.widgetOptions.$sticky.parent() : [],
			nestedStickyTop = $nestedSticky.length ? $nestedSticky.height() : 0,
			// clone table, then wrap to make sticky header
			$stickyTable = wo.$sticky = $table.clone()
				.addClass('containsStickyHeaders ' + ts.css.sticky + ' ' + wo.stickyHeaders + ' ' + c.namespace.slice(1) + '_extra_table' )
				.wrap('<div class="' + ts.css.stickyWrap + '">'),
			$stickyWrap = $stickyTable.parent()
				.addClass(ts.css.stickyHide)
				.css({
					position   : $attach.length ? 'absolute' : 'fixed',
					padding    : parseInt( $stickyTable.parent().parent().css('padding-left'), 10 ),
					top        : stickyOffset + nestedStickyTop,
					left       : 0,
					visibility : 'hidden',
					zIndex     : wo.stickyHeaders_zIndex || 2
				}),
			$stickyThead = $stickyTable.children('thead:first'),
			$stickyCells,
			laststate = '',
			spacing = 0,
			setWidth = function($orig, $clone){
				$orig.filter(':visible').each(function(i) {
					var width, border,
						$cell = $clone.filter(':visible').eq(i),
						$this = $(this);
					// code from https://github.com/jmosbech/StickyTableHeaders
					if ($this.css('box-sizing') === 'border-box') {
						width = $this.outerWidth();
					} else {
						if ($cell.css('border-collapse') === 'collapse') {
							if (window.getComputedStyle) {
								width = parseFloat( window.getComputedStyle(this, null).width );
							} else {
								// ie8 only
								border = parseFloat( $this.css('border-width') );
								width = $this.outerWidth() - parseFloat( $this.css('padding-left') ) - parseFloat( $this.css('padding-right') ) - border;
							}
						} else {
							width = $this.width();
						}
					}
					$cell.css({
						'min-width': width,
						'max-width': width
					});
				});
			},
			resizeHeader = function() {
				stickyOffset = $stickyOffset.length ? $stickyOffset.height() || 0 : parseInt(wo.stickyHeaders_offset, 10) || 0;
				spacing = 0;
				$stickyWrap.css({
					left : $attach.length ? parseInt($attach.css('padding-left'), 10) || 0 :
							$table.offset().left - parseInt($table.css('margin-left'), 10) - $xScroll.scrollLeft() - spacing,
					width: $table.outerWidth()
				});
				setWidth( $table, $stickyTable );
				setWidth( $header, $stickyCells );
			};
		// only add a position relative if a position isn't already defined
		if ($attach.length && !$attach.css('position')) {
			$attach.css('position', 'relative');
		}
		// fix clone ID, if it exists - fixes #271
		if ($stickyTable.attr('id')) { $stickyTable[0].id += wo.stickyHeaders_cloneId; }
		// clear out cloned table, except for sticky header
		// include caption & filter row (fixes #126 & #249) - don't remove cells to get correct cell indexing
		$stickyTable.find('thead:gt(0), tr.sticky-false').hide();
		$stickyTable.find('tbody, tfoot').remove();
		$stickyTable.find('caption').toggle(wo.stickyHeaders_includeCaption);
		// issue #172 - find td/th in sticky header
		$stickyCells = $stickyThead.children().children();
		$stickyTable.css({ height:0, width:0, margin: 0 });
		// remove resizable block
		$stickyCells.find('.' + ts.css.resizer).remove();
		// update sticky header class names to match real header after sorting
		$table
			.addClass('hasStickyHeaders')
			.bind('pagerComplete' + namespace, function() {
				resizeHeader();
			});

		ts.bindEvents(table, $stickyThead.children().children('.' + ts.css.header));

		// add stickyheaders AFTER the table. If the table is selected by ID, the original one (first) will be returned.
		$table.after( $stickyWrap );

		// onRenderHeader is defined, we need to do something about it (fixes #641)
		if (c.onRenderHeader) {
			$stickyThead.children('tr').children().each(function(index){
				// send second parameter
				c.onRenderHeader.apply( $(this), [ index, c, $stickyTable ] );
			});
		}

		// make it sticky!
		$xScroll.add($yScroll)
		.unbind( ('scroll resize '.split(' ').join( namespace )).replace(/\s+/g, ' ') )
		.bind('scroll resize '.split(' ').join( namespace ), function(event) {
			if (!$table.is(':visible')) { return; } // fixes #278
			// Detect nested tables - fixes #724
			nestedStickyTop = $nestedSticky.length ? $nestedSticky.offset().top - $yScroll.scrollTop() + $nestedSticky.height() : 0;
			var offset = $table.offset(),
				yWindow = $.isWindow( $yScroll[0] ), // $.isWindow needs jQuery 1.4.3
				xWindow = $.isWindow( $xScroll[0] ),
				// scrollTop = ( $attach.length ? $attach.offset().top : $yScroll.scrollTop() ) + stickyOffset + nestedStickyTop,
				scrollTop = ( $attach.length ? ( yWindow ? $yScroll.scrollTop() : $yScroll.offset().top ) : $yScroll.scrollTop() ) + stickyOffset + nestedStickyTop,
				tableHeight = $table.height() - ($stickyWrap.height() + ($tfoot.height() || 0)),
				isVisible = ( scrollTop > offset.top ) && ( scrollTop < offset.top + tableHeight ) ? 'visible' : 'hidden',
				cssSettings = { visibility : isVisible };

			if ($attach.length) {
				cssSettings.top = yWindow ? scrollTop - $attach.offset().top : $attach.scrollTop();
			}
			if (xWindow) {
				// adjust when scrolling horizontally - fixes issue #143
				cssSettings.left = $table.offset().left - parseInt($table.css('margin-left'), 10) - $xScroll.scrollLeft() - spacing;
			}
			if ($nestedSticky.length) {
				cssSettings.top = ( cssSettings.top || 0 ) + stickyOffset + nestedStickyTop;
			}
			$stickyWrap
				.removeClass( ts.css.stickyVis + ' ' + ts.css.stickyHide )
				.addClass( isVisible === 'visible' ? ts.css.stickyVis : ts.css.stickyHide )
				.css(cssSettings);
			if (isVisible !== laststate || event.type === 'resize') {
				// make sure the column widths match
				resizeHeader();
				laststate = isVisible;
			}
		});
		if (wo.stickyHeaders_addResizeEvent) {
			ts.addHeaderResizeEvent(table);
		}

		// look for filter widget
		if ($table.hasClass('hasFilters') && wo.filter_columnFilters) {
			// scroll table into view after filtering, if sticky header is active - #482
			$table.bind('filterEnd' + namespace, function() {
				// $(':focus') needs jQuery 1.6+
				var $td = $(document.activeElement).closest('td'),
					column = $td.parent().children().index($td);
				// only scroll if sticky header is active
				if ($stickyWrap.hasClass(ts.css.stickyVis) && wo.stickyHeaders_filteredToTop) {
					// scroll to original table (not sticky clone)
					window.scrollTo(0, $table.position().top);
					// give same input/select focus; check if c.$filters exists; fixes #594
					if (column >= 0 && c.$filters) {
						c.$filters.eq(column).find('a, select, input').filter(':visible').focus();
					}
				}
			});
			ts.filter.bindSearch( $table, $stickyCells.find('.' + ts.css.filter) );
			// support hideFilters
			if (wo.filter_hideFilters) {
				ts.filter.hideFilters($stickyTable, c);
			}
		}

		$table.trigger('stickyHeadersInit');

	},
	remove: function(table, c, wo) {
		var namespace = c.namespace + 'stickyheaders ';
		c.$table
			.removeClass('hasStickyHeaders')
			.unbind( ('pagerComplete filterEnd '.split(' ').join(namespace)).replace(/\s+/g, ' ') )
			.next('.' + ts.css.stickyWrap).remove();
		if (wo.$sticky && wo.$sticky.length) { wo.$sticky.remove(); } // remove cloned table
		$(window)
			.add(wo.stickyHeaders_xScroll)
			.add(wo.stickyHeaders_yScroll)
			.add(wo.stickyHeaders_attachTo)
			.unbind( ('scroll resize '.split(' ').join(namespace)).replace(/\s+/g, ' ') );
		ts.addHeaderResizeEvent(table, false);
	}
});

})(jQuery, window);

/*! Widget: resizable - updated 4/2/2015 (v2.21.5) */
;(function ($, window) {
'use strict';
var ts = $.tablesorter = $.tablesorter || {};

$.extend(ts.css, {
	resizableContainer : 'tablesorter-resizable-container',
	resizableHandle    : 'tablesorter-resizable-handle',
	resizableNoSelect  : 'tablesorter-disableSelection',
	resizableStorage   : 'tablesorter-resizable'
});

// Add extra scroller css
$(function(){
	var s = '<style>' +
		'body.' + ts.css.resizableNoSelect + ' { -ms-user-select: none; -moz-user-select: -moz-none;' +
			'-khtml-user-select: none; -webkit-user-select: none; user-select: none; }' +
		'.' + ts.css.resizableContainer + ' { position: relative; height: 1px; }' +
		// make handle z-index > than stickyHeader z-index, so the handle stays above sticky header
		'.' + ts.css.resizableHandle + ' { position: absolute; display: inline-block; width: 8px; top: 1px;' +
			'cursor: ew-resize; z-index: 3; user-select: none; -moz-user-select: none; }' +
		'</style>';
	$(s).appendTo('body');
});

ts.resizable = {
	init : function( c, wo ) {
		if ( c.$table.hasClass( 'hasResizable' ) ) { return; }
		c.$table.addClass( 'hasResizable' );
		ts.resizableReset( c.table, true ); // set default widths

		// internal variables
		wo.resizable_ = {
			$wrap : c.$table.parent(),
			mouseXPosition : 0,
			$target : null,
			$next : null,
			overflow : c.$table.parent().css('overflow') === 'auto',
			fullWidth : Math.abs(c.$table.parent().width() - c.$table.width()) < 20,
			storedSizes : []
		};

		var noResize, $header, column, storedSizes,
			marginTop = parseInt( c.$table.css( 'margin-top' ), 10 );

		wo.resizable_.storedSizes = storedSizes = ( ( ts.storage && wo.resizable !== false ) ?
			ts.storage( c.table, ts.css.resizableStorage ) :
			[] ) || [];
		ts.resizable.setWidths( c, wo, storedSizes );

		wo.$resizable_container = $( '<div class="' + ts.css.resizableContainer + '">' )
			.css({ top : marginTop })
			.insertBefore( c.$table );
		// add container
		for ( column = 0; column < c.columns; column++ ) {
			$header = c.$headerIndexed[ column ];
			noResize = ts.getData( $header, ts.getColumnData( c.table, c.headers, column ), 'resizable' ) === 'false';
			if ( !noResize ) {
				$( '<div class="' + ts.css.resizableHandle + '">' )
					.appendTo( wo.$resizable_container )
					.attr({
						'data-column' : column,
						'unselectable' : 'on'
					})
					.data( 'header', $header )
					.bind( 'selectstart', false );
			}
		}
		c.$table.one('tablesorter-initialized', function() {
			ts.resizable.setHandlePosition( c, wo );
			ts.resizable.bindings( this.config, this.config.widgetOptions );
		});
	},

	setWidth : function( $el, width ) {
		$el.css({
			'width' : width,
			'min-width' : '',
			'max-width' : ''
		});
	},

	setWidths : function( c, wo, storedSizes ) {
		var column,
			$extra = $( c.namespace + '_extra_headers' ),
			$col = c.$table.children( 'colgroup' ).children( 'col' );
		storedSizes = storedSizes || wo.resizable_.storedSizes || [];
		// process only if table ID or url match
		if ( storedSizes.length ) {
			for ( column = 0; column < c.columns; column++ ) {
				// set saved resizable widths
				c.$headerIndexed[ column ].width( storedSizes[ column ] );
				if ( $extra.length ) {
					// stickyHeaders needs to modify min & max width as well
					ts.resizable.setWidth( $extra.eq( column ).add( $col.eq( column ) ), storedSizes[ column ] );
				}
			}
			if ( $( c.namespace + '_extra_table' ).length && !ts.hasWidget( c.table, 'scroller' ) ) {
				ts.resizable.setWidth( $( c.namespace + '_extra_table' ), c.$table.outerWidth() );
			}
		}
	},

	setHandlePosition : function( c, wo ) {
		var startPosition,
			hasScroller = ts.hasWidget( c.table, 'scroller' ),
			tableHeight = c.$table.height(),
			$handles = wo.$resizable_container.children(),
			handleCenter = Math.floor( $handles.width() / 2 );

		if ( hasScroller ) {
			tableHeight = 0;
			c.$table.closest( '.' + ts.css.scrollerWrap ).children().each(function(){
				var $this = $(this);
				// center table has a max-height set
				tableHeight += $this.filter('[style*="height"]').length ? $this.height() : $this.children('table').height();
			});
		}
		// subtract out table left position from resizable handles. Fixes #864
		startPosition = c.$table.position().left;
		$handles.each( function() {
			var $this = $(this),
				column = parseInt( $this.attr( 'data-column' ), 10 ),
				columns = c.columns - 1,
				$header = $this.data( 'header' );
			if ( !$header ) { return; } // see #859
			if ( !$header.is(':visible') ) {
				$this.hide();
			} else if ( column < columns || column === columns && wo.resizable_addLastColumn ) {
				$this.css({
					display: 'inline-block',
					height : tableHeight,
					left : $header.position().left - startPosition + $header.outerWidth() - handleCenter
				});
			}
		});
	},

	// prevent text selection while dragging resize bar
	toggleTextSelection : function( c, toggle ) {
		var namespace = c.namespace + 'tsresize';
		c.widgetOptions.resizable_.disabled = toggle;
		$( 'body' ).toggleClass( ts.css.resizableNoSelect, toggle );
		if ( toggle ) {
			$( 'body' )
				.attr( 'unselectable', 'on' )
				.bind( 'selectstart' + namespace, false );
		} else {
			$( 'body' )
				.removeAttr( 'unselectable' )
				.unbind( 'selectstart' + namespace );
		}
	},

	bindings : function( c, wo ) {
		var namespace = c.namespace + 'tsresize';
		wo.$resizable_container.children().bind( 'mousedown', function( event ) {
			// save header cell and mouse position
			var column, $this,
				vars = wo.resizable_,
				$extras = $( c.namespace + '_extra_headers' ),
				$header = $( event.target ).data( 'header' );

			column = parseInt( $header.attr( 'data-column' ), 10 );
			vars.$target = $header = $header.add( $extras.filter('[data-column="' + column + '"]') );
			vars.target = column;

			// if table is not as wide as it's parent, then resize the table
			vars.$next = event.shiftKey || wo.resizable_targetLast ?
				$header.parent().children().not( '.resizable-false' ).filter( ':last' ) :
				$header.nextAll( ':not(.resizable-false)' ).eq( 0 );

			column = parseInt( vars.$next.attr( 'data-column' ), 10 );
			vars.$next = vars.$next.add( $extras.filter('[data-column="' + column + '"]') );
			vars.next = column;

			vars.mouseXPosition = event.pageX;
			vars.storedSizes = [];
			for ( column = 0; column < c.columns; column++ ) {
				$this = c.$headerIndexed[ column ];
				vars.storedSizes[ column ] = $this.is(':visible') ? $this.width() : 0;
			}
			ts.resizable.toggleTextSelection( c, true );
		});

		$( document )
			.bind( 'mousemove' + namespace, function( event ) {
				var vars = wo.resizable_;
				// ignore mousemove if no mousedown
				if ( !vars.disabled || vars.mouseXPosition === 0 || !vars.$target ) { return; }
				if ( wo.resizable_throttle ) {
					clearTimeout( vars.timer );
					vars.timer = setTimeout( function() {
						ts.resizable.mouseMove( c, wo, event );
					}, isNaN( wo.resizable_throttle ) ? 5 : wo.resizable_throttle );
				} else {
					ts.resizable.mouseMove( c, wo, event );
				}
			})
			.bind( 'mouseup' + namespace, function() {
				if (!wo.resizable_.disabled) { return; }
				ts.resizable.toggleTextSelection( c, false );
				ts.resizable.stopResize( c, wo );
				ts.resizable.setHandlePosition( c, wo );
			});

		// resizeEnd event triggered by scroller widget
		$( window ).bind( 'resize' + namespace + ' resizeEnd' + namespace, function() {
			ts.resizable.setHandlePosition( c, wo );
		});

		// right click to reset columns to default widths
		c.$table
			.bind( 'columnUpdate' + namespace, function() {
				ts.resizable.setHandlePosition( c, wo );
			})
			.find( 'thead:first' )
			.add( $( c.namespace + '_extra_table' ).find( 'thead:first' ) )
			.bind( 'contextmenu' + namespace, function() {
				// $.isEmptyObject() needs jQuery 1.4+; allow right click if already reset
				var allowClick = wo.resizable_.storedSizes.length === 0;
				ts.resizableReset( c.table );
				ts.resizable.setHandlePosition( c, wo );
				wo.resizable_.storedSizes = [];
				return allowClick;
			});

	},

	mouseMove : function( c, wo, event ) {
		if ( wo.resizable_.mouseXPosition === 0 || !wo.resizable_.$target ) { return; }
		// resize columns
		var vars = wo.resizable_,
			$next = vars.$next,
			leftEdge = event.pageX - vars.mouseXPosition;
		if ( vars.fullWidth ) {
			vars.storedSizes[ vars.target ] += leftEdge;
			vars.storedSizes[ vars.next ] -= leftEdge;
			ts.resizable.setWidths( c, wo );

		} else if ( vars.overflow ) {
			c.$table.add( $( c.namespace + '_extra_table' ) ).width(function(i, w){
				return w + leftEdge;
			});
			if ( !$next.length ) {
				// if expanding right-most column, scroll the wrapper
				vars.$wrap[0].scrollLeft = c.$table.width();
			}
		} else {
			vars.storedSizes[ vars.target ] += leftEdge;
			ts.resizable.setWidths( c, wo );
		}
		vars.mouseXPosition = event.pageX;
	},

	stopResize : function( c, wo ) {
		var $this, column,
			vars = wo.resizable_;
		vars.storedSizes = [];
		if ( ts.storage ) {
			vars.storedSizes = [];
			for ( column = 0; column < c.columns; column++ ) {
				$this = c.$headerIndexed[ column ];
				vars.storedSizes[ column ] = $this.is(':visible') ? $this.width() : 0;
			}
			if ( wo.resizable !== false ) {
				// save all column widths
				ts.storage( c.table, ts.css.resizableStorage, vars.storedSizes );
			}
		}
		vars.mouseXPosition = 0;
		vars.$target = vars.$next = null;
		$(window).trigger('resize'); // will update stickyHeaders, just in case
	}
};

// this widget saves the column widths if
// $.tablesorter.storage function is included
// **************************
ts.addWidget({
	id: "resizable",
	priority: 40,
	options: {
		resizable : true,
		resizable_addLastColumn : false,
		resizable_widths : [],
		resizable_throttle : false, // set to true (5ms) or any number 0-10 range
		resizable_targetLast : false
	},
	init: function(table, thisWidget, c, wo) {
		ts.resizable.init( c, wo );
	},
	remove: function( table, c, wo ) {
		if (wo.$resizable_container) {
			var namespace = c.namespace + 'tsresize';
			c.$table.add( $( c.namespace + '_extra_table' ) )
				.removeClass('hasResizable')
				.children( 'thead' ).unbind( 'contextmenu' + namespace );

				wo.$resizable_container.remove();
			ts.resizable.toggleTextSelection( c, false );
			ts.resizableReset( table );
			$( document ).unbind( 'mousemove' + namespace + ' mouseup' + namespace );
		}
	}
});

ts.resizableReset = function( table, nosave ) {
	$( table ).each(function(){
		var index, $t,
			c = this.config,
			wo = c && c.widgetOptions;
		if ( table && c && c.$headerIndexed.length ) {
			for ( index = 0; index < c.columns; index++ ) {
				$t = c.$headerIndexed[ index ];
				if ( wo.resizable_widths && wo.resizable_widths[ index ] ) {
					$t.css( 'width', wo.resizable_widths[ index ] );
				} else if ( !$t.hasClass( 'resizable-false' ) ) {
					// don't clear the width of any column that is not resizable
					$t.css( 'width', '' );
				}
			}
			// reset stickyHeader widths
			$( window ).trigger( 'resize' );
			if ( ts.storage && !nosave ) {
				ts.storage( this, ts.css.resizableStorage, {} );
			}
		}
	});
};

})( jQuery, window );

/*! Widget: saveSort */
;(function ($) {
'use strict';
var ts = $.tablesorter = $.tablesorter || {};

// this widget saves the last sort only if the
// saveSort widget option is true AND the
// $.tablesorter.storage function is included
// **************************
ts.addWidget({
	id: 'saveSort',
	priority: 20,
	options: {
		saveSort : true
	},
	init: function(table, thisWidget, c, wo) {
		// run widget format before all other widgets are applied to the table
		thisWidget.format(table, c, wo, true);
	},
	format: function(table, c, wo, init) {
		var stored, time,
			$table = c.$table,
			saveSort = wo.saveSort !== false, // make saveSort active/inactive; default to true
			sortList = { "sortList" : c.sortList };
		if (c.debug) {
			time = new Date();
		}
		if ($table.hasClass('hasSaveSort')) {
			if (saveSort && table.hasInitialized && ts.storage) {
				ts.storage( table, 'tablesorter-savesort', sortList );
				if (c.debug) {
					ts.benchmark('saveSort widget: Saving last sort: ' + c.sortList, time);
				}
			}
		} else {
			// set table sort on initial run of the widget
			$table.addClass('hasSaveSort');
			sortList = '';
			// get data
			if (ts.storage) {
				stored = ts.storage( table, 'tablesorter-savesort' );
				sortList = (stored && stored.hasOwnProperty('sortList') && $.isArray(stored.sortList)) ? stored.sortList : '';
				if (c.debug) {
					ts.benchmark('saveSort: Last sort loaded: "' + sortList + '"', time);
				}
				$table.bind('saveSortReset', function(event) {
					event.stopPropagation();
					ts.storage( table, 'tablesorter-savesort', '' );
				});
			}
			// init is true when widget init is run, this will run this widget before all other widgets have initialized
			// this method allows using this widget in the original tablesorter plugin; but then it will run all widgets twice.
			if (init && sortList && sortList.length > 0) {
				c.sortList = sortList;
			} else if (table.hasInitialized && sortList && sortList.length > 0) {
				// update sort change
				$table.trigger('sorton', [sortList]);
			}
		}
	},
	remove: function(table, c) {
		c.$table.removeClass('hasSaveSort');
		// clear storage
		if (ts.storage) { ts.storage( table, 'tablesorter-savesort', '' ); }
	}
});

})(jQuery);

return $.tablesorter;
}));
/** @preserve
 * jsPDF - PDF Document creation from JavaScript
 * Version ${versionID}
 *                           CommitID ${commitID}
 *
 * Copyright (c) 2010-2014 James Hall <james@parall.ax>, https://github.com/MrRio/jsPDF
 *               2010 Aaron Spike, https://github.com/acspike
 *               2012 Willow Systems Corporation, willow-systems.com
 *               2012 Pablo Hess, https://github.com/pablohess
 *               2012 Florian Jenett, https://github.com/fjenett
 *               2013 Warren Weckesser, https://github.com/warrenweckesser
 *               2013 Youssef Beddad, https://github.com/lifof
 *               2013 Lee Driscoll, https://github.com/lsdriscoll
 *               2013 Stefan Slonevskiy, https://github.com/stefslon
 *               2013 Jeremy Morel, https://github.com/jmorel
 *               2013 Christoph Hartmann, https://github.com/chris-rock
 *               2014 Juan Pablo Gaviria, https://github.com/juanpgaviria
 *               2014 James Makes, https://github.com/dollaruw
 *               2014 Diego Casorran, https://github.com/diegocr
 *               2014 Steven Spungin, https://github.com/Flamenco
 *               2014 Kenneth Glassey, https://github.com/Gavvers
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Contributor(s):
 *    siefkenj, ahwolf, rickygu, Midnith, saintclair, eaparango,
 *    kim3er, mfo, alnorth, Flamenco
 */

/**
 * Creates new jsPDF document object instance.
 *
 * @class
 * @param orientation One of "portrait" or "landscape" (or shortcuts "p" (Default), "l")
 * @param unit        Measurement unit to be used when coordinates are specified.
 *                    One of "pt" (points), "mm" (Default), "cm", "in"
 * @param format      One of 'pageFormats' as shown below, default: a4
 * @returns {jsPDF}
 * @name jsPDF
 */
var jsPDF = (function(global) {
  'use strict';
  var pdfVersion = '1.3',
    pageFormats = { // Size in pt of various paper formats
      'a0'  : [2383.94, 3370.39], 'a1'  : [1683.78, 2383.94],
      'a2'  : [1190.55, 1683.78], 'a3'  : [ 841.89, 1190.55],
      'a4'  : [ 595.28,  841.89], 'a5'  : [ 419.53,  595.28],
      'a6'  : [ 297.64,  419.53], 'a7'  : [ 209.76,  297.64],
      'a8'  : [ 147.40,  209.76], 'a9'  : [ 104.88,  147.40],
      'a10' : [  73.70,  104.88], 'b0'  : [2834.65, 4008.19],
      'b1'  : [2004.09, 2834.65], 'b2'  : [1417.32, 2004.09],
      'b3'  : [1000.63, 1417.32], 'b4'  : [ 708.66, 1000.63],
      'b5'  : [ 498.90,  708.66], 'b6'  : [ 354.33,  498.90],
      'b7'  : [ 249.45,  354.33], 'b8'  : [ 175.75,  249.45],
      'b9'  : [ 124.72,  175.75], 'b10' : [  87.87,  124.72],
      'c0'  : [2599.37, 3676.54], 'c1'  : [1836.85, 2599.37],
      'c2'  : [1298.27, 1836.85], 'c3'  : [ 918.43, 1298.27],
      'c4'  : [ 649.13,  918.43], 'c5'  : [ 459.21,  649.13],
      'c6'  : [ 323.15,  459.21], 'c7'  : [ 229.61,  323.15],
      'c8'  : [ 161.57,  229.61], 'c9'  : [ 113.39,  161.57],
      'c10' : [  79.37,  113.39], 'dl'  : [ 311.81,  623.62],
      'letter'            : [612,   792],
      'government-letter' : [576,   756],
      'legal'             : [612,  1008],
      'junior-legal'      : [576,   360],
      'ledger'            : [1224,  792],
      'tabloid'           : [792,  1224],
      'credit-card'       : [153,   243]
    };

  /**
   * jsPDF's Internal PubSub Implementation.
   * See mrrio.github.io/jsPDF/doc/symbols/PubSub.html
   * Backward compatible rewritten on 2014 by
   * Diego Casorran, https://github.com/diegocr
   *
   * @class
   * @name PubSub
   */
  function PubSub(context) {
    var topics = {};

    this.subscribe = function(topic, callback, once) {
      if(typeof callback !== 'function') {
        return false;
      }

      if(!topics.hasOwnProperty(topic)) {
        topics[topic] = {};
      }

      var id = Math.random().toString(35);
      topics[topic][id] = [callback,!!once];

      return id;
    };

    this.unsubscribe = function(token) {
      for(var topic in topics) {
        if(topics[topic][token]) {
          delete topics[topic][token];
          return true;
        }
      }
      return false;
    };

    this.publish = function(topic) {
      if(topics.hasOwnProperty(topic)) {
        var args = Array.prototype.slice.call(arguments, 1), idr = [];

        for(var id in topics[topic]) {
          var sub = topics[topic][id];
          try {
            sub[0].apply(context, args);
          } catch(ex) {
            if(global.console) {
              console.error('jsPDF PubSub Error', ex.message, ex);
            }
          }
          if(sub[1]) idr.push(id);
        }
        if(idr.length) idr.forEach(this.unsubscribe);
      }
    };
  }

  /**
   * @constructor
   * @private
   */
  function jsPDF(orientation, unit, format, compressPdf) {
    var options = {};

    if (typeof orientation === 'object') {
      options = orientation;

      orientation = options.orientation;
      unit = options.unit || unit;
      format = options.format || format;
      compressPdf = options.compress || options.compressPdf || compressPdf;
    }

    // Default options
    unit        = unit || 'mm';
    format      = format || 'a4';
    orientation = ('' + (orientation || 'P')).toLowerCase();

    var format_as_string = ('' + format).toLowerCase(),
      compress = !!compressPdf && typeof Uint8Array === 'function',
      textColor            = options.textColor  || '0 g',
      drawColor            = options.drawColor  || '0 G',
      activeFontSize       = options.fontSize   || 16,
      lineHeightProportion = options.lineHeight || 1.15,
      lineWidth            = options.lineWidth  || 0.200025, // 2mm
      objectNumber =  2,  // 'n' Current object number
      outToPages   = !1,  // switches where out() prints. outToPages true = push to pages obj. outToPages false = doc builder content
      offsets      = [],  // List of offsets. Activated and reset by buildDocument(). Pupulated by various calls buildDocument makes.
      fonts        = {},  // collection of font objects, where key is fontKey - a dynamically created label for a given font.
      fontmap      = {},  // mapping structure fontName > fontStyle > font key - performance layer. See addFont()
      activeFontKey,      // will be string representing the KEY of the font as combination of fontName + fontStyle
      k,                  // Scale factor
      tmp,
      page = 0,
      currentPage,
      pages = [],
      pagesContext = [], // same index as pages and pagedim
      pagedim = [],
      content = [],
      additionalObjects = [],
      lineCapID = 0,
      lineJoinID = 0,
      content_length = 0,
      pageWidth,
      pageHeight,
      pageMode,
      zoomMode,
      layoutMode,
      documentProperties = {
        'title'    : '',
        'subject'  : '',
        'author'   : '',
        'keywords' : '',
        'creator'  : ''
      },
      API = {},
      events = new PubSub(API),

    /////////////////////
    // Private functions
    /////////////////////
    f2 = function(number) {
      return number.toFixed(2); // Ie, %.2f
    },
    f3 = function(number) {
      return number.toFixed(3); // Ie, %.3f
    },
    padd2 = function(number) {
      return ('0' + parseInt(number)).slice(-2);
    },
    out = function(string) {
      if (outToPages) {
        /* set by beginPage */
        pages[currentPage].push(string);
      } else {
        // +1 for '\n' that will be used to join 'content'
        content_length += string.length + 1;
        content.push(string);
      }
    },
    newObject = function() {
      // Begin a new object
      objectNumber++;
      offsets[objectNumber] = content_length;
      out(objectNumber + ' 0 obj');
      return objectNumber;
    },
    // Does not output the object until after the pages have been output.
    // Returns an object containing the objectId and content.
    // All pages have been added so the object ID can be estimated to start right after.
    // This does not modify the current objectNumber;  It must be updated after the newObjects are output.
    newAdditionalObject = function() {
      var objId = pages.length * 2 + 1;
      objId += additionalObjects.length;
      var obj = {objId:objId, content:''};
      additionalObjects.push(obj);
      return obj;
    },
    // Does not output the object.  The caller must call newObjectDeferredBegin(oid) before outputing any data
    newObjectDeferred = function() {
      objectNumber++;
      offsets[objectNumber] = function(){
        return content_length;
      };
      return objectNumber;
    },
    newObjectDeferredBegin = function(oid) {
      offsets[oid] = content_length;
    },
    putStream = function(str) {
      out('stream');
      out(str);
      out('endstream');
    },
    putPages = function() {
      var n,p,arr,i,deflater,adler32,adler32cs,wPt,hPt;

      adler32cs = global.adler32cs || jsPDF.adler32cs;
      if (compress && typeof adler32cs === 'undefined') {
        compress = false;
      }

      // outToPages = false as set in endDocument(). out() writes to content.

      for (n = 1; n <= page; n++) {
        newObject();
        wPt = (pageWidth = pagedim[n].width) * k;
        hPt = (pageHeight = pagedim[n].height) * k;
        out('<</Type /Page');
        out('/Parent 1 0 R');
        out('/Resources 2 0 R');
        out('/MediaBox [0 0 ' + f2(wPt) + ' ' + f2(hPt) + ']');
        out('/Contents ' + (objectNumber + 1) + ' 0 R');
        // Added for annotation plugin
        events.publish('putPage', {pageNumber:n,page:pages[n]});
        out('>>');
        out('endobj');

        // Page content
        p = pages[n].join('\n');
        newObject();
        if (compress) {
          arr = [];
          i = p.length;
          while(i--) {
            arr[i] = p.charCodeAt(i);
          }
          adler32 = adler32cs.from(p);
          deflater = new Deflater(6);
          deflater.append(new Uint8Array(arr));
          p = deflater.flush();
          arr = new Uint8Array(p.length + 6);
          arr.set(new Uint8Array([120, 156])),
          arr.set(p, 2);
          arr.set(new Uint8Array([adler32 & 0xFF, (adler32 >> 8) & 0xFF, (adler32 >> 16) & 0xFF, (adler32 >> 24) & 0xFF]), p.length+2);
          p = String.fromCharCode.apply(null, arr);
          out('<</Length ' + p.length + ' /Filter [/FlateDecode]>>');
        } else {
          out('<</Length ' + p.length + '>>');
        }
        putStream(p);
        out('endobj');
      }
      offsets[1] = content_length;
      out('1 0 obj');
      out('<</Type /Pages');
      var kids = '/Kids [';
      for (i = 0; i < page; i++) {
        kids += (3 + 2 * i) + ' 0 R ';
      }
      out(kids + ']');
      out('/Count ' + page);
      out('>>');
      out('endobj');
    },
    putFont = function(font) {
      font.objectNumber = newObject();
      out('<</BaseFont/' + font.PostScriptName + '/Type/Font');
      if (typeof font.encoding === 'string') {
        out('/Encoding/' + font.encoding);
      }
      out('/Subtype/Type1>>');
      out('endobj');
    },
    putFonts = function() {
      for (var fontKey in fonts) {
        if (fonts.hasOwnProperty(fontKey)) {
          putFont(fonts[fontKey]);
        }
      }
    },
    putXobjectDict = function() {
      // Loop through images, or other data objects
      events.publish('putXobjectDict');
    },
    putResourceDictionary = function() {
      out('/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]');
      out('/Font <<');

      // Do this for each font, the '1' bit is the index of the font
      for (var fontKey in fonts) {
        if (fonts.hasOwnProperty(fontKey)) {
          out('/' + fontKey + ' ' + fonts[fontKey].objectNumber + ' 0 R');
        }
      }
      out('>>');
      out('/XObject <<');
      putXobjectDict();
      out('>>');
    },
    putResources = function() {
      putFonts();
      events.publish('putResources');
      // Resource dictionary
      offsets[2] = content_length;
      out('2 0 obj');
      out('<<');
      putResourceDictionary();
      out('>>');
      out('endobj');
      events.publish('postPutResources');
    },
    putAdditionalObjects = function() {
      events.publish('putAdditionalObjects');
      for (var i=0; i<additionalObjects.length; i++){
        var obj = additionalObjects[i];
        offsets[obj.objId] = content_length;
        out( obj.objId + ' 0 obj');
        out(obj.content);;
        out('endobj');
      }
      objectNumber += additionalObjects.length;
      events.publish('postPutAdditionalObjects');
    },
    addToFontDictionary = function(fontKey, fontName, fontStyle) {
      // this is mapping structure for quick font key lookup.
      // returns the KEY of the font (ex: "F1") for a given
      // pair of font name and type (ex: "Arial". "Italic")
      if (!fontmap.hasOwnProperty(fontName)) {
        fontmap[fontName] = {};
      }
      fontmap[fontName][fontStyle] = fontKey;
    },
    /**
     * FontObject describes a particular font as member of an instnace of jsPDF
     *
     * It's a collection of properties like 'id' (to be used in PDF stream),
     * 'fontName' (font's family name), 'fontStyle' (font's style variant label)
     *
     * @class
     * @public
     * @property id {String} PDF-document-instance-specific label assinged to the font.
     * @property PostScriptName {String} PDF specification full name for the font
     * @property encoding {Object} Encoding_name-to-Font_metrics_object mapping.
     * @name FontObject
     */
    addFont = function(PostScriptName, fontName, fontStyle, encoding) {
      var fontKey = 'F' + (Object.keys(fonts).length + 1).toString(10),
      // This is FontObject
      font = fonts[fontKey] = {
        'id'             : fontKey,
        'PostScriptName' : PostScriptName,
        'fontName'       : fontName,
        'fontStyle'      : fontStyle,
        'encoding'       : encoding,
        'metadata'       : {}
      };
      addToFontDictionary(fontKey, fontName, fontStyle);
      events.publish('addFont', font);

      return fontKey;
    },
    addFonts = function() {

      var HELVETICA     = "helvetica",
        TIMES         = "times",
        COURIER       = "courier",
        NORMAL        = "normal",
        BOLD          = "bold",
        ITALIC        = "italic",
        BOLD_ITALIC   = "bolditalic",
        encoding      = 'StandardEncoding',
        standardFonts = [
          ['Helvetica', HELVETICA, NORMAL],
          ['Helvetica-Bold', HELVETICA, BOLD],
          ['Helvetica-Oblique', HELVETICA, ITALIC],
          ['Helvetica-BoldOblique', HELVETICA, BOLD_ITALIC],
          ['Courier', COURIER, NORMAL],
          ['Courier-Bold', COURIER, BOLD],
          ['Courier-Oblique', COURIER, ITALIC],
          ['Courier-BoldOblique', COURIER, BOLD_ITALIC],
          ['Times-Roman', TIMES, NORMAL],
          ['Times-Bold', TIMES, BOLD],
          ['Times-Italic', TIMES, ITALIC],
          ['Times-BoldItalic', TIMES, BOLD_ITALIC]
        ];

      for (var i = 0, l = standardFonts.length; i < l; i++) {
        var fontKey = addFont(
            standardFonts[i][0],
            standardFonts[i][1],
            standardFonts[i][2],
            encoding);

        // adding aliases for standard fonts, this time matching the capitalization
        var parts = standardFonts[i][0].split('-');
        addToFontDictionary(fontKey, parts[0], parts[1] || '');
      }
      events.publish('addFonts', { fonts : fonts, dictionary : fontmap });
    },
    SAFE = function __safeCall(fn) {
      fn.foo = function __safeCallWrapper() {
        try {
          return fn.apply(this, arguments);
        } catch (e) {
          var stack = e.stack || '';
          if(~stack.indexOf(' at ')) stack = stack.split(" at ")[1];
          var m = "Error in function " + stack.split("\n")[0].split('<')[0] + ": " + e.message;
          if(global.console) {
            global.console.error(m, e);
            if(global.alert) alert(m);
          } else {
            throw new Error(m);
          }
        }
      };
      fn.foo.bar = fn;
      return fn.foo;
    },
    to8bitStream = function(text, flags) {
    /**
     * PDF 1.3 spec:
     * "For text strings encoded in Unicode, the first two bytes must be 254 followed by
     * 255, representing the Unicode byte order marker, U+FEFF. (This sequence conflicts
     * with the PDFDocEncoding character sequence thorn ydieresis, which is unlikely
     * to be a meaningful beginning of a word or phrase.) The remainder of the
     * string consists of Unicode character codes, according to the UTF-16 encoding
     * specified in the Unicode standard, version 2.0. Commonly used Unicode values
     * are represented as 2 bytes per character, with the high-order byte appearing first
     * in the string."
     *
     * In other words, if there are chars in a string with char code above 255, we
     * recode the string to UCS2 BE - string doubles in length and BOM is prepended.
     *
     * HOWEVER!
     * Actual *content* (body) text (as opposed to strings used in document properties etc)
     * does NOT expect BOM. There, it is treated as a literal GID (Glyph ID)
     *
     * Because of Adobe's focus on "you subset your fonts!" you are not supposed to have
     * a font that maps directly Unicode (UCS2 / UTF16BE) code to font GID, but you could
     * fudge it with "Identity-H" encoding and custom CIDtoGID map that mimics Unicode
     * code page. There, however, all characters in the stream are treated as GIDs,
     * including BOM, which is the reason we need to skip BOM in content text (i.e. that
     * that is tied to a font).
     *
     * To signal this "special" PDFEscape / to8bitStream handling mode,
     * API.text() function sets (unless you overwrite it with manual values
     * given to API.text(.., flags) )
     * flags.autoencode = true
     * flags.noBOM = true
     *
     * ===================================================================================
     * `flags` properties relied upon:
     *   .sourceEncoding = string with encoding label.
     *                     "Unicode" by default. = encoding of the incoming text.
     *                     pass some non-existing encoding name
     *                     (ex: 'Do not touch my strings! I know what I am doing.')
     *                     to make encoding code skip the encoding step.
     *   .outputEncoding = Either valid PDF encoding name
     *                     (must be supported by jsPDF font metrics, otherwise no encoding)
     *                     or a JS object, where key = sourceCharCode, value = outputCharCode
     *                     missing keys will be treated as: sourceCharCode === outputCharCode
     *   .noBOM
     *       See comment higher above for explanation for why this is important
     *   .autoencode
     *       See comment higher above for explanation for why this is important
     */

      var i,l,sourceEncoding,encodingBlock,outputEncoding,newtext,isUnicode,ch,bch;

      flags = flags || {};
      sourceEncoding = flags.sourceEncoding || 'Unicode';
      outputEncoding = flags.outputEncoding;

      // This 'encoding' section relies on font metrics format
      // attached to font objects by, among others,
      // "Willow Systems' standard_font_metrics plugin"
      // see jspdf.plugin.standard_font_metrics.js for format
      // of the font.metadata.encoding Object.
      // It should be something like
      //   .encoding = {'codePages':['WinANSI....'], 'WinANSI...':{code:code, ...}}
      //   .widths = {0:width, code:width, ..., 'fof':divisor}
      //   .kerning = {code:{previous_char_code:shift, ..., 'fof':-divisor},...}
      if ((flags.autoencode || outputEncoding) &&
        fonts[activeFontKey].metadata &&
        fonts[activeFontKey].metadata[sourceEncoding] &&
        fonts[activeFontKey].metadata[sourceEncoding].encoding) {
        encodingBlock = fonts[activeFontKey].metadata[sourceEncoding].encoding;

        // each font has default encoding. Some have it clearly defined.
        if (!outputEncoding && fonts[activeFontKey].encoding) {
          outputEncoding = fonts[activeFontKey].encoding;
        }

        // Hmmm, the above did not work? Let's try again, in different place.
        if (!outputEncoding && encodingBlock.codePages) {
          outputEncoding = encodingBlock.codePages[0]; // let's say, first one is the default
        }

        if (typeof outputEncoding === 'string') {
          outputEncoding = encodingBlock[outputEncoding];
        }
        // we want output encoding to be a JS Object, where
        // key = sourceEncoding's character code and
        // value = outputEncoding's character code.
        if (outputEncoding) {
          isUnicode = false;
          newtext = [];
          for (i = 0, l = text.length; i < l; i++) {
            ch = outputEncoding[text.charCodeAt(i)];
            if (ch) {
              newtext.push(
                String.fromCharCode(ch));
            } else {
              newtext.push(
                text[i]);
            }

            // since we are looping over chars anyway, might as well
            // check for residual unicodeness
            if (newtext[i].charCodeAt(0) >> 8) {
              /* more than 255 */
              isUnicode = true;
            }
          }
          text = newtext.join('');
        }
      }

      i = text.length;
      // isUnicode may be set to false above. Hence the triple-equal to undefined
      while (isUnicode === undefined && i !== 0) {
        if (text.charCodeAt(i - 1) >> 8) {
          /* more than 255 */
          isUnicode = true;
        }
        i--;
      }
      if (!isUnicode) {
        return text;
      }

      newtext = flags.noBOM ? [] : [254, 255];
      for (i = 0, l = text.length; i < l; i++) {
        ch = text.charCodeAt(i);
        bch = ch >> 8; // divide by 256
        if (bch >> 8) {
          /* something left after dividing by 256 second time */
          throw new Error("Character at position " + i + " of string '"
            + text + "' exceeds 16bits. Cannot be encoded into UCS-2 BE");
        }
        newtext.push(bch);
        newtext.push(ch - (bch << 8));
      }
      return String.fromCharCode.apply(undefined, newtext);
    },
    pdfEscape = function(text, flags) {
      /**
       * Replace '/', '(', and ')' with pdf-safe versions
       *
       * Doing to8bitStream does NOT make this PDF display unicode text. For that
       * we also need to reference a unicode font and embed it - royal pain in the rear.
       *
       * There is still a benefit to to8bitStream - PDF simply cannot handle 16bit chars,
       * which JavaScript Strings are happy to provide. So, while we still cannot display
       * 2-byte characters property, at least CONDITIONALLY converting (entire string containing)
       * 16bit chars to (USC-2-BE) 2-bytes per char + BOM streams we ensure that entire PDF
       * is still parseable.
       * This will allow immediate support for unicode in document properties strings.
       */
      return to8bitStream(text, flags).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    },
    putInfo = function() {
      out('/Producer (jsPDF ' + jsPDF.version + ')');
      for(var key in documentProperties) {
        if(documentProperties.hasOwnProperty(key) && documentProperties[key]) {
          out('/'+key.substr(0,1).toUpperCase() + key.substr(1)
            +' (' + pdfEscape(documentProperties[key]) + ')');
        }
      }
      var created  = new Date(),
        tzoffset = created.getTimezoneOffset(),
        tzsign   = tzoffset < 0 ? '+' : '-',
        tzhour   = Math.floor(Math.abs(tzoffset / 60)),
        tzmin    = Math.abs(tzoffset % 60),
        tzstr    = [tzsign, padd2(tzhour), "'", padd2(tzmin), "'"].join('');
      out(['/CreationDate (D:',
          created.getFullYear(),
          padd2(created.getMonth() + 1),
          padd2(created.getDate()),
          padd2(created.getHours()),
          padd2(created.getMinutes()),
          padd2(created.getSeconds()), tzstr, ')'].join(''));
    },
    putCatalog = function() {
      out('/Type /Catalog');
      out('/Pages 1 0 R');
      // PDF13ref Section 7.2.1
      if (!zoomMode) zoomMode = 'fullwidth';
      switch(zoomMode) {
        case 'fullwidth'  : out('/OpenAction [3 0 R /FitH null]');       break;
        case 'fullheight' : out('/OpenAction [3 0 R /FitV null]');       break;
        case 'fullpage'   : out('/OpenAction [3 0 R /Fit]');             break;
        case 'original'   : out('/OpenAction [3 0 R /XYZ null null 1]'); break;
        default:
          var pcn = '' + zoomMode;
          if (pcn.substr(pcn.length-1) === '%')
            zoomMode = parseInt(zoomMode) / 100;
          if (typeof zoomMode === 'number') {
            out('/OpenAction [3 0 R /XYZ null null '+f2(zoomMode)+']');
          }
      }
      if (!layoutMode) layoutMode = 'continuous';
      switch(layoutMode) {
        case 'continuous' : out('/PageLayout /OneColumn');      break;
        case 'single'     : out('/PageLayout /SinglePage');     break;
        case 'two':
        case 'twoleft'    : out('/PageLayout /TwoColumnLeft');  break;
        case 'tworight'   : out('/PageLayout /TwoColumnRight'); break;
      }
      if (pageMode) {
        /**
         * A name object specifying how the document should be displayed when opened:
         * UseNone      : Neither document outline nor thumbnail images visible -- DEFAULT
         * UseOutlines  : Document outline visible
         * UseThumbs    : Thumbnail images visible
         * FullScreen   : Full-screen mode, with no menu bar, window controls, or any other window visible
         */
        out('/PageMode /' + pageMode);
      }
      events.publish('putCatalog');
    },
    putTrailer = function() {
      out('/Size ' + (objectNumber + 1));
      out('/Root ' + objectNumber + ' 0 R');
      out('/Info ' + (objectNumber - 1) + ' 0 R');
    },
    beginPage = function(width,height) {
      // Dimensions are stored as user units and converted to points on output
      var orientation = typeof height === 'string' && height.toLowerCase();
      if (typeof width === 'string') {
        var format = width.toLowerCase();
        if (pageFormats.hasOwnProperty(format)) {
          width  = pageFormats[format][0] / k;
          height = pageFormats[format][1] / k;
        }
      }
      if (Array.isArray(width)) {
        height = width[1];
        width = width[0];
      }
      if (orientation) {
        switch(orientation.substr(0,1)) {
          case 'l': if (height > width ) orientation = 's'; break;
          case 'p': if (width > height ) orientation = 's'; break;
        }
        if (orientation === 's') { tmp = width; width = height; height = tmp; }
      }
      outToPages = true;
      pages[++page] = [];
      pagedim[page] = {
        width  : Number(width)  || pageWidth,
        height : Number(height) || pageHeight
      };
      pagesContext[page] = {};
      _setPage(page);
    },
    _addPage = function() {
      beginPage.apply(this, arguments);
      // Set line width
      out(f2(lineWidth * k) + ' w');
      // Set draw color
      out(drawColor);
      // resurrecting non-default line caps, joins
      if (lineCapID !== 0) {
        out(lineCapID + ' J');
      }
      if (lineJoinID !== 0) {
        out(lineJoinID + ' j');
      }
      events.publish('addPage', { pageNumber : page });
    },
    _deletePage = function( n ) {
      if (n > 0 && n <= page) {
        pages.splice(n, 1);
        pagedim.splice(n, 1);
        page--;
        if (currentPage > page){
          currentPage = page;
        }
        this.setPage(currentPage);
      }
    },
    _setPage = function(n) {
      if (n > 0 && n <= page) {
        currentPage = n;
        pageWidth = pagedim[n].width;
        pageHeight = pagedim[n].height;
      }
    },
    /**
     * Returns a document-specific font key - a label assigned to a
     * font name + font type combination at the time the font was added
     * to the font inventory.
     *
     * Font key is used as label for the desired font for a block of text
     * to be added to the PDF document stream.
     * @private
     * @function
     * @param fontName {String} can be undefined on "falthy" to indicate "use current"
     * @param fontStyle {String} can be undefined on "falthy" to indicate "use current"
     * @returns {String} Font key.
     */
    getFont = function(fontName, fontStyle) {
      var key;

      fontName  = fontName  !== undefined ? fontName  : fonts[activeFontKey].fontName;
      fontStyle = fontStyle !== undefined ? fontStyle : fonts[activeFontKey].fontStyle;

      if (fontName !== undefined){
        fontName = fontName.toLowerCase();
      }
      switch(fontName){
      case 'sans-serif':
      case 'verdana':
      case 'arial':
        fontName = 'helvetica';
        break;
      case 'fixed':
      case 'monospace':
      case 'terminal':
        fontName = 'courier';
        break;
      case 'serif':
      case 'cursive':
      case 'fantasy':
        default:
        fontName = 'times';
        break;
      }

      try {
       // get a string like 'F3' - the KEY corresponding tot he font + type combination.
        key = fontmap[fontName][fontStyle];
      } catch (e) {}

      if (!key) {
        //throw new Error("Unable to look up font label for font '" + fontName + "', '"
          //+ fontStyle + "'. Refer to getFontList() for available fonts.");
        key = fontmap['times'][fontStyle];
        if (key == null){
          key = fontmap['times']['normal'];
        }
      }
      return key;
    },
    buildDocument = function() {

      outToPages = false; // switches out() to content
      objectNumber = 2;
      content = [];
      offsets = [];
      additionalObjects = [];

      // putHeader()
      out('%PDF-' + pdfVersion);

      putPages();

      // Must happen after putPages
      // Modifies current object Id
      putAdditionalObjects();

      putResources();

      // Info
      newObject();
      out('<<');
      putInfo();
      out('>>');
      out('endobj');

      // Catalog
      newObject();
      out('<<');
      putCatalog();
      out('>>');
      out('endobj');

      // Cross-ref
      var o = content_length, i, p = "0000000000";
      out('xref');
      out('0 ' + (objectNumber + 1));
      out(p+' 65535 f ');
      for (i = 1; i <= objectNumber; i++) {
        var offset = offsets[i];
        if (typeof offset === 'function'){
          out((p + offsets[i]()).slice(-10) + ' 00000 n ');
        }else{
          out((p + offsets[i]).slice(-10) + ' 00000 n ');
        }
      }
      // Trailer
      out('trailer');
      out('<<');
      putTrailer();
      out('>>');
      out('startxref');
      out(o);
      out('%%EOF');

      outToPages = true;

      return content.join('\n');
    },
    getStyle = function(style) {
      // see path-painting operators in PDF spec
      var op = 'S'; // stroke
      if (style === 'F') {
        op = 'f'; // fill
      } else if (style === 'FD' || style === 'DF') {
        op = 'B'; // both
      } else if (style === 'f' || style === 'f*' || style === 'B' || style === 'B*') {
        /*
        Allow direct use of these PDF path-painting operators:
        - f fill using nonzero winding number rule
        - f*  fill using even-odd rule
        - B fill then stroke with fill using non-zero winding number rule
        - B*  fill then stroke with fill using even-odd rule
        */
        op = style;
      }
      return op;
    },
    getArrayBuffer = function() {
      var data = buildDocument(), len = data.length,
        ab = new ArrayBuffer(len), u8 = new Uint8Array(ab);

      while(len--) u8[len] = data.charCodeAt(len);
      return ab;
    },
    getBlob = function() {
      return new Blob([getArrayBuffer()], { type : "application/pdf" });
    },
    /**
     * Generates the PDF document.
     *
     * If `type` argument is undefined, output is raw body of resulting PDF returned as a string.
     *
     * @param {String} type A string identifying one of the possible output types.
     * @param {Object} options An object providing some additional signalling to PDF generator.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name output
     */
    output = SAFE(function(type, options) {
      var datauri = ('' + type).substr(0,6) === 'dataur'
        ? 'data:application/pdf;base64,'+btoa(buildDocument()):0;

      switch (type) {
        case undefined:
          return buildDocument();
        case 'save':
          if (navigator.getUserMedia) {
            if (global.URL === undefined
            || global.URL.createObjectURL === undefined) {
              return API.output('dataurlnewwindow');
            }
          }
          saveAs(getBlob(), options);
          if(typeof saveAs.unload === 'function') {
            if(global.setTimeout) {
              setTimeout(saveAs.unload,911);
            }
          }
          break;
        case 'arraybuffer':
          return getArrayBuffer();
        case 'blob':
          return getBlob();
        case 'bloburi':
        case 'bloburl':
          // User is responsible of calling revokeObjectURL
          return global.URL && global.URL.createObjectURL(getBlob()) || void 0;
        case 'datauristring':
        case 'dataurlstring':
          return datauri;
        case 'dataurlnewwindow':
          var nW = global.open(datauri);
          if (nW || typeof safari === "undefined") return nW;
          /* pass through */
        case 'datauri':
        case 'dataurl':
          return global.document.location.href = datauri;
        default:
          throw new Error('Output type "' + type + '" is not supported.');
      }
      // @TODO: Add different output options
    });

    switch (unit) {
      case 'pt':  k = 1;                break;
      case 'mm':  k = 72 / 25.4000508;  break;
      case 'cm':  k = 72 / 2.54000508;  break;
      case 'in':  k = 72;               break;
      case 'px':  k = 96 / 72;          break;
      case 'pc':  k = 12;               break;
      case 'em':  k = 12;               break;
      case 'ex':  k = 6;                break;
      default:
        throw ('Invalid unit: ' + unit);
    }

    //---------------------------------------
    // Public API

    /**
     * Object exposing internal API to plugins
     * @public
     */
    API.internal = {
      'pdfEscape' : pdfEscape,
      'getStyle' : getStyle,
      /**
       * Returns {FontObject} describing a particular font.
       * @public
       * @function
       * @param fontName {String} (Optional) Font's family name
       * @param fontStyle {String} (Optional) Font's style variation name (Example:"Italic")
       * @returns {FontObject}
       */
      'getFont' : function() {
        return fonts[getFont.apply(API, arguments)];
      },
      'getFontSize' : function() {
        return activeFontSize;
      },
      'getLineHeight' : function() {
        return activeFontSize * lineHeightProportion;
      },
      'write' : function(string1 /*, string2, string3, etc */) {
        out(arguments.length === 1 ? string1 : Array.prototype.join.call(arguments, ' '));
      },
      'getCoordinateString' : function(value) {
        return f2(value * k);
      },
      'getVerticalCoordinateString' : function(value) {
        return f2((pageHeight - value) * k);
      },
      'collections' : {},
      'newObject' : newObject,
      'newAdditionalObject' : newAdditionalObject,
      'newObjectDeferred' : newObjectDeferred,
      'newObjectDeferredBegin' : newObjectDeferredBegin,
      'putStream' : putStream,
      'events' : events,
      // ratio that you use in multiplication of a given "size" number to arrive to 'point'
      // units of measurement.
      // scaleFactor is set at initialization of the document and calculated against the stated
      // default measurement units for the document.
      // If default is "mm", k is the number that will turn number in 'mm' into 'points' number.
      // through multiplication.
      'scaleFactor' : k,
      'pageSize' : {
        get width() {
          return pageWidth
        },
        get height() {
          return pageHeight
        }
      },
      'output' : function(type, options) {
        return output(type, options);
      },
      'getNumberOfPages' : function() {
        return pages.length - 1;
      },
      'pages' : pages,
      'out' : out,
      'f2' : f2,
      'getPageInfo' : function(pageNumberOneBased){
        var objId = (pageNumberOneBased - 1) * 2 + 3;
        return {objId:objId, pageNumber:pageNumberOneBased, pageContext:pagesContext[pageNumberOneBased]};
      },
      'getCurrentPageInfo' : function(){
        var objId = (currentPage - 1) * 2 + 3;
        return {objId:objId, pageNumber:currentPage, pageContext:pagesContext[currentPage]};
      }
    };

    /**
     * Adds (and transfers the focus to) new page to the PDF document.
     * @function
     * @returns {jsPDF}
     *
     * @methodOf jsPDF#
     * @name addPage
     */
    API.addPage = function() {
      _addPage.apply(this, arguments);
      return this;
    };
    API.setPage = function() {
      _setPage.apply(this, arguments);
      return this;
    };
    API.insertPage = function(beforePage) {
      this.addPage();
      this.movePage(currentPage, beforePage);
      return this;
    };
    API.movePage = function(targetPage, beforePage) {
      if (targetPage > beforePage){
        var tmpPages = pages[targetPage];
        var tmpPagedim = pagedim[targetPage];
        var tmpPagesContext = pagesContext[targetPage];
        for (var i=targetPage; i>beforePage; i--){
          pages[i] = pages[i-1];
          pagedim[i] = pagedim[i-1];
          pagesContext[i] = pagesContext[i-1];
        }
        pages[beforePage] = tmpPages;
        pagedim[beforePage] = tmpPagedim;
        pagesContext[beforePage] = tmpPagesContext;
        this.setPage(beforePage);
      }else if (targetPage < beforePage){
        var tmpPages = pages[targetPage];
        var tmpPagedim = pagedim[targetPage];
        var tmpPagesContext = pagesContext[targetPage];
        for (var i=targetPage; i<beforePage; i++){
          pages[i] = pages[i+1];
          pagedim[i] = pagedim[i+1];
          pagesContext[i] = pagesContext[i+1];
        }
        pages[beforePage] = tmpPages;
        pagedim[beforePage] = tmpPagedim;
        pagesContext[beforePage] = tmpPagesContext;
        this.setPage(beforePage);
      }
      return this;
    };

    API.deletePage = function() {
      _deletePage.apply( this, arguments );
      return this;
    };
    API.setDisplayMode = function(zoom, layout, pmode) {
      zoomMode   = zoom;
      layoutMode = layout;
      pageMode   = pmode;
      return this;
    },

    /**
     * Adds text to page. Supports adding multiline text when 'text' argument is an Array of Strings.
     *
     * @function
     * @param {String|Array} text String or array of strings to be added to the page. Each line is shifted one line down per font, spacing settings declared before this call.
     * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {Object} flags Collection of settings signalling how the text must be encoded. Defaults are sane. If you think you want to pass some flags, you likely can read the source.
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name text
     */
    API.text = function(text, x, y, flags, angle, align) {
      /**
       * Inserts something like this into PDF
       *   BT
       *    /F1 16 Tf  % Font name + size
       *    16 TL % How many units down for next line in multiline text
       *    0 g % color
       *    28.35 813.54 Td % position
       *    (line one) Tj
       *    T* (line two) Tj
       *    T* (line three) Tj
       *   ET
       */
      function ESC(s) {
        s = s.split("\t").join(Array(options.TabLen||9).join(" "));
        return pdfEscape(s, flags);
      }

      // Pre-August-2012 the order of arguments was function(x, y, text, flags)
      // in effort to make all calls have similar signature like
      //   function(data, coordinates... , miscellaneous)
      // this method had its args flipped.
      // code below allows backward compatibility with old arg order.
      if (typeof text === 'number') {
        tmp = y;
        y = x;
        x = text;
        text = tmp;
      }

      // If there are any newlines in text, we assume
      // the user wanted to print multiple lines, so break the
      // text up into an array.  If the text is already an array,
      // we assume the user knows what they are doing.
      // Convert text into an array anyway to simplify
      // later code.
      if (typeof text === 'string') {
        if(text.match(/[\n\r]/)) {
          text = text.split( /\r\n|\r|\n/g);
        } else {
          text = [text];
        }
      }
      if (typeof angle === 'string') {
        align = angle;
        angle = null;
      }
      if (typeof flags === 'string') {
        align = flags;
        flags = null;
      }
      if (typeof flags === 'number') {
        angle = flags;
        flags = null;
      }
      var xtra = '',mode = 'Td', todo;
      if (angle) {
        angle *= (Math.PI / 180);
        var c = Math.cos(angle),
        s = Math.sin(angle);
        xtra = [f2(c), f2(s), f2(s * -1), f2(c), ''].join(" ");
        mode = 'Tm';
      }
      flags = flags || {};
      if (!('noBOM' in flags))
        flags.noBOM = true;
      if (!('autoencode' in flags))
        flags.autoencode = true;

      var strokeOption = '';
      var pageContext = this.internal.getCurrentPageInfo().pageContext;
      if (true === flags.stroke){
        if (pageContext.lastTextWasStroke !== true){
          strokeOption = '1 Tr\n';
          pageContext.lastTextWasStroke = true;
        }
      }
      else{
        if (pageContext.lastTextWasStroke){
          strokeOption = '0 Tr\n';
        }
        pageContext.lastTextWasStroke = false;
      }

      if (typeof this._runningPageHeight === 'undefined'){
        this._runningPageHeight = 0;
      }

      if (typeof text === 'string') {
        text = ESC(text);
      } else if (text instanceof Array) {
        // we don't want to destroy  original text array, so cloning it
        var sa = text.concat(), da = [], len = sa.length;
        // we do array.join('text that must not be PDFescaped")
        // thus, pdfEscape each component separately
        while (len--) {
          da.push(ESC(sa.shift()));
        }
        var linesLeft = Math.ceil((pageHeight - y - this._runningPageHeight) * k / (activeFontSize * lineHeightProportion));
        if (0 <= linesLeft && linesLeft < da.length + 1) {
          //todo = da.splice(linesLeft-1);
        }

        if( align ) {
          var left,
            prevX,
            maxLineLength,
            leading =  activeFontSize * lineHeightProportion,
            lineWidths = text.map( function( v ) {
              return this.getStringUnitWidth( v ) * activeFontSize / k;
            }, this );
          maxLineLength = Math.max.apply( Math, lineWidths );
          // The first line uses the "main" Td setting,
          // and the subsequent lines are offset by the
          // previous line's x coordinate.
          if( align === "center" ) {
            // The passed in x coordinate defines
            // the center point.
            left = x - maxLineLength / 2;
            x -= lineWidths[0] / 2;
          } else if ( align === "right" ) {
            // The passed in x coordinate defines the
            // rightmost point of the text.
            left = x - maxLineLength;
            x -= lineWidths[0];
          } else {
            throw new Error('Unrecognized alignment option, use "center" or "right".');
          }
          prevX = x;
          text = da[0] + ") Tj\n";
          for ( i = 1, len = da.length ; i < len; i++ ) {
            var delta = maxLineLength - lineWidths[i];
            if( align === "center" ) delta /= 2;
            // T* = x-offset leading Td ( text )
            text += ( ( left - prevX ) + delta ) + " -" + leading + " Td (" + da[i];
            prevX = left + delta;
            if( i < len - 1 ) {
              text += ") Tj\n";
            }
          }
        } else {
          text = da.join(") Tj\nT* (");
        }
      } else {
        throw new Error('Type of text must be string or Array. "' + text + '" is not recognized.');
      }
      // Using "'" ("go next line and render text" mark) would save space but would complicate our rendering code, templates

      // BT .. ET does NOT have default settings for Tf. You must state that explicitely every time for BT .. ET
      // if you want text transformation matrix (+ multiline) to work reliably (which reads sizes of things from font declarations)
      // Thus, there is NO useful, *reliable* concept of "default" font for a page.
      // The fact that "default" (reuse font used before) font worked before in basic cases is an accident
      // - readers dealing smartly with brokenness of jsPDF's markup.

      var curY;

      if (todo){
        //this.addPage();
        //this._runningPageHeight += y -  (activeFontSize * 1.7 / k);
        //curY = f2(pageHeight - activeFontSize * 1.7 /k);
      }else{
        curY = f2((pageHeight - y) * k);
      }
      //curY = f2((pageHeight - (y - this._runningPageHeight)) * k);

//      if (curY < 0){
//        console.log('auto page break');
//        this.addPage();
//        this._runningPageHeight = y -  (activeFontSize * 1.7 / k);
//        curY = f2(pageHeight - activeFontSize * 1.7 /k);
//      }

      out(
        'BT\n/' +
        activeFontKey + ' ' + activeFontSize + ' Tf\n' +     // font face, style, size
        (activeFontSize * lineHeightProportion) + ' TL\n' +  // line spacing
        strokeOption +// stroke option
        textColor +
        '\n' + xtra + f2(x * k) + ' ' + curY + ' ' + mode + '\n(' +
        text +
        ') Tj\nET');

      if (todo) {
        //this.text( todo, x, activeFontSize * 1.7 / k);
        //this.text( todo, x, this._runningPageHeight + (activeFontSize * 1.7 / k));
        this.text( todo, x, y);// + (activeFontSize * 1.7 / k));
      }

      return this;
    };

    API.lstext = function(text, x, y, spacing) {
      for (var i = 0, len = text.length ; i < len; i++, x += spacing) this.text(text[i], x, y);
    };

    API.line = function(x1, y1, x2, y2) {
      return this.lines([[x2 - x1, y2 - y1]], x1, y1);
    };

    API.clip = function() {
      // By patrick-roberts, github.com/MrRio/jsPDF/issues/328
      // Call .clip() after calling .rect() with a style argument of null
      out('W') // clip
      out('S') // stroke path; necessary for clip to work
    };

    /**
     * Adds series of curves (straight lines or cubic bezier curves) to canvas, starting at `x`, `y` coordinates.
     * All data points in `lines` are relative to last line origin.
     * `x`, `y` become x1,y1 for first line / curve in the set.
     * For lines you only need to specify [x2, y2] - (ending point) vector against x1, y1 starting point.
     * For bezier curves you need to specify [x2,y2,x3,y3,x4,y4] - vectors to control points 1, 2, ending point. All vectors are against the start of the curve - x1,y1.
     *
     * @example .lines([[2,2],[-2,2],[1,1,2,2,3,3],[2,1]], 212,110, 10) // line, line, bezier curve, line
     * @param {Array} lines Array of *vector* shifts as pairs (lines) or sextets (cubic bezier curves).
     * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {Number} scale (Defaults to [1.0,1.0]) x,y Scaling factor for all vectors. Elements can be any floating number Sub-one makes drawing smaller. Over-one grows the drawing. Negative flips the direction.
     * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
     * @param {Boolean} closed If true, the path is closed with a straight line from the end of the last curve to the starting point.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name lines
     */
    API.lines = function(lines, x, y, scale, style, closed) {
      var scalex,scaley,i,l,leg,x2,y2,x3,y3,x4,y4;

      // Pre-August-2012 the order of arguments was function(x, y, lines, scale, style)
      // in effort to make all calls have similar signature like
      //   function(content, coordinateX, coordinateY , miscellaneous)
      // this method had its args flipped.
      // code below allows backward compatibility with old arg order.
      if (typeof lines === 'number') {
        tmp = y;
        y = x;
        x = lines;
        lines = tmp;
      }

      scale = scale || [1, 1];

      // starting point
      out(f3(x * k) + ' ' + f3((pageHeight - y) * k) + ' m ');

      scalex = scale[0];
      scaley = scale[1];
      l = lines.length;
      //, x2, y2 // bezier only. In page default measurement "units", *after* scaling
      //, x3, y3 // bezier only. In page default measurement "units", *after* scaling
      // ending point for all, lines and bezier. . In page default measurement "units", *after* scaling
      x4 = x; // last / ending point = starting point for first item.
      y4 = y; // last / ending point = starting point for first item.

      for (i = 0; i < l; i++) {
        leg = lines[i];
        if (leg.length === 2) {
          // simple line
          x4 = leg[0] * scalex + x4; // here last x4 was prior ending point
          y4 = leg[1] * scaley + y4; // here last y4 was prior ending point
          out(f3(x4 * k) + ' ' + f3((pageHeight - y4) * k) + ' l');
        } else {
          // bezier curve
          x2 = leg[0] * scalex + x4; // here last x4 is prior ending point
          y2 = leg[1] * scaley + y4; // here last y4 is prior ending point
          x3 = leg[2] * scalex + x4; // here last x4 is prior ending point
          y3 = leg[3] * scaley + y4; // here last y4 is prior ending point
          x4 = leg[4] * scalex + x4; // here last x4 was prior ending point
          y4 = leg[5] * scaley + y4; // here last y4 was prior ending point
          out(
            f3(x2 * k) + ' ' +
            f3((pageHeight - y2) * k) + ' ' +
            f3(x3 * k) + ' ' +
            f3((pageHeight - y3) * k) + ' ' +
            f3(x4 * k) + ' ' +
            f3((pageHeight - y4) * k) + ' c');
        }
      }

      if (closed) {
        out(' h');
      }

      // stroking / filling / both the path
      if (style !== null) {
        out(getStyle(style));
      }
      return this;
    };

    /**
     * Adds a rectangle to PDF
     *
     * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {Number} w Width (in units declared at inception of PDF document)
     * @param {Number} h Height (in units declared at inception of PDF document)
     * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name rect
     */
    API.rect = function(x, y, w, h, style) {
      var op = getStyle(style);
      out([
          f2(x * k),
          f2((pageHeight - y) * k),
          f2(w * k),
          f2(-h * k),
          're'
        ].join(' '));

      if (style !== null) {
        out(getStyle(style));
      }

      return this;
    };

    /**
     * Adds a triangle to PDF
     *
     * @param {Number} x1 Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y1 Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {Number} x2 Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y2 Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {Number} x3 Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y3 Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name triangle
     */
    API.triangle = function(x1, y1, x2, y2, x3, y3, style) {
      this.lines(
        [
          [x2 - x1, y2 - y1], // vector to point 2
          [x3 - x2, y3 - y2], // vector to point 3
          [x1 - x3, y1 - y3]// closing vector back to point 1
        ],
        x1,
        y1, // start of path
        [1, 1],
        style,
        true);
      return this;
    };

    /**
     * Adds a rectangle with rounded corners to PDF
     *
     * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {Number} w Width (in units declared at inception of PDF document)
     * @param {Number} h Height (in units declared at inception of PDF document)
     * @param {Number} rx Radius along x axis (in units declared at inception of PDF document)
     * @param {Number} rx Radius along y axis (in units declared at inception of PDF document)
     * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name roundedRect
     */
    API.roundedRect = function(x, y, w, h, rx, ry, style) {
      var MyArc = 4 / 3 * (Math.SQRT2 - 1);
      this.lines(
        [
          [(w - 2 * rx), 0],
          [(rx * MyArc), 0, rx, ry - (ry * MyArc), rx, ry],
          [0, (h - 2 * ry)],
          [0, (ry * MyArc),  - (rx * MyArc), ry, -rx, ry],
          [(-w + 2 * rx), 0],
          [ - (rx * MyArc), 0, -rx,  - (ry * MyArc), -rx, -ry],
          [0, (-h + 2 * ry)],
          [0,  - (ry * MyArc), (rx * MyArc), -ry, rx, -ry]
        ],
        x + rx,
        y, // start of path
        [1, 1],
        style);
      return this;
    };

    /**
     * Adds an ellipse to PDF
     *
     * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {Number} rx Radius along x axis (in units declared at inception of PDF document)
     * @param {Number} rx Radius along y axis (in units declared at inception of PDF document)
     * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name ellipse
     */
    API.ellipse = function(x, y, rx, ry, style) {
      var lx = 4 / 3 * (Math.SQRT2 - 1) * rx,
        ly = 4 / 3 * (Math.SQRT2 - 1) * ry;

      out([
          f2((x + rx) * k),
          f2((pageHeight - y) * k),
          'm',
          f2((x + rx) * k),
          f2((pageHeight - (y - ly)) * k),
          f2((x + lx) * k),
          f2((pageHeight - (y - ry)) * k),
          f2(x * k),
          f2((pageHeight - (y - ry)) * k),
          'c'
        ].join(' '));
      out([
          f2((x - lx) * k),
          f2((pageHeight - (y - ry)) * k),
          f2((x - rx) * k),
          f2((pageHeight - (y - ly)) * k),
          f2((x - rx) * k),
          f2((pageHeight - y) * k),
          'c'
        ].join(' '));
      out([
          f2((x - rx) * k),
          f2((pageHeight - (y + ly)) * k),
          f2((x - lx) * k),
          f2((pageHeight - (y + ry)) * k),
          f2(x * k),
          f2((pageHeight - (y + ry)) * k),
          'c'
        ].join(' '));
      out([
          f2((x + lx) * k),
          f2((pageHeight - (y + ry)) * k),
          f2((x + rx) * k),
          f2((pageHeight - (y + ly)) * k),
          f2((x + rx) * k),
          f2((pageHeight - y) * k),
          'c'
        ].join(' '));

      if (style !== null) {
        out(getStyle(style));
      }

      return this;
    };

    /**
     * Adds an circle to PDF
     *
     * @param {Number} x Coordinate (in units declared at inception of PDF document) against left edge of the page
     * @param {Number} y Coordinate (in units declared at inception of PDF document) against upper edge of the page
     * @param {Number} r Radius (in units declared at inception of PDF document)
     * @param {String} style A string specifying the painting style or null.  Valid styles include: 'S' [default] - stroke, 'F' - fill,  and 'DF' (or 'FD') -  fill then stroke. A null value postpones setting the style so that a shape may be composed using multiple method calls. The last drawing method call used to define the shape should not have a null style argument.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name circle
     */
    API.circle = function(x, y, r, style) {
      return this.ellipse(x, y, r, r, style);
    };

    /**
     * Adds a properties to the PDF document
     *
     * @param {Object} A property_name-to-property_value object structure.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setProperties
     */
    API.setProperties = function(properties) {
      // copying only those properties we can render.
      for (var property in documentProperties) {
        if (documentProperties.hasOwnProperty(property) && properties[property]) {
          documentProperties[property] = properties[property];
        }
      }
      return this;
    };

    /**
     * Sets font size for upcoming text elements.
     *
     * @param {Number} size Font size in points.
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setFontSize
     */
    API.setFontSize = function(size) {
      activeFontSize = size;
      return this;
    };

    /**
     * Sets text font face, variant for upcoming text elements.
     * See output of jsPDF.getFontList() for possible font names, styles.
     *
     * @param {String} fontName Font name or family. Example: "times"
     * @param {String} fontStyle Font style or variant. Example: "italic"
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setFont
     */
    API.setFont = function(fontName, fontStyle) {
      activeFontKey = getFont(fontName, fontStyle);
      // if font is not found, the above line blows up and we never go further
      return this;
    };

    /**
     * Switches font style or variant for upcoming text elements,
     * while keeping the font face or family same.
     * See output of jsPDF.getFontList() for possible font names, styles.
     *
     * @param {String} style Font style or variant. Example: "italic"
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setFontStyle
     */
    API.setFontStyle = API.setFontType = function(style) {
      activeFontKey = getFont(undefined, style);
      // if font is not found, the above line blows up and we never go further
      return this;
    };

    /**
     * Returns an object - a tree of fontName to fontStyle relationships available to
     * active PDF document.
     *
     * @public
     * @function
     * @returns {Object} Like {'times':['normal', 'italic', ... ], 'arial':['normal', 'bold', ... ], ... }
     * @methodOf jsPDF#
     * @name getFontList
     */
    API.getFontList = function() {
      // TODO: iterate over fonts array or return copy of fontmap instead in case more are ever added.
      var list = {},fontName,fontStyle,tmp;

      for (fontName in fontmap) {
        if (fontmap.hasOwnProperty(fontName)) {
          list[fontName] = tmp = [];
          for (fontStyle in fontmap[fontName]) {
            if (fontmap[fontName].hasOwnProperty(fontStyle)) {
              tmp.push(fontStyle);
            }
          }
        }
      }

      return list;
    };

    /**
     * Add a custom font.
     *
     * @param {String} Postscript name of the Font.  Example: "Menlo-Regular"
     * @param {String} Name of font-family from @font-face definition.  Example: "Menlo Regular"
     * @param {String} Font style.  Example: "normal"
     * @function
     * @returns the {fontKey} (same as the internal method)
     * @methodOf jsPDF#
     * @name addFont
     */
    API.addFont = function(postScriptName, fontName, fontStyle) {
      addFont(postScriptName, fontName, fontStyle, 'StandardEncoding');
    };

    /**
     * Sets line width for upcoming lines.
     *
     * @param {Number} width Line width (in units declared at inception of PDF document)
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setLineWidth
     */
    API.setLineWidth = function(width) {
      out((width * k).toFixed(2) + ' w');
      return this;
    };

    /**
     * Sets the stroke color for upcoming elements.
     *
     * Depending on the number of arguments given, Gray, RGB, or CMYK
     * color space is implied.
     *
     * When only ch1 is given, "Gray" color space is implied and it
     * must be a value in the range from 0.00 (solid black) to to 1.00 (white)
     * if values are communicated as String types, or in range from 0 (black)
     * to 255 (white) if communicated as Number type.
     * The RGB-like 0-255 range is provided for backward compatibility.
     *
     * When only ch1,ch2,ch3 are given, "RGB" color space is implied and each
     * value must be in the range from 0.00 (minimum intensity) to to 1.00
     * (max intensity) if values are communicated as String types, or
     * from 0 (min intensity) to to 255 (max intensity) if values are communicated
     * as Number types.
     * The RGB-like 0-255 range is provided for backward compatibility.
     *
     * When ch1,ch2,ch3,ch4 are given, "CMYK" color space is implied and each
     * value must be a in the range from 0.00 (0% concentration) to to
     * 1.00 (100% concentration)
     *
     * Because JavaScript treats fixed point numbers badly (rounds to
     * floating point nearest to binary representation) it is highly advised to
     * communicate the fractional numbers as String types, not JavaScript Number type.
     *
     * @param {Number|String} ch1 Color channel value
     * @param {Number|String} ch2 Color channel value
     * @param {Number|String} ch3 Color channel value
     * @param {Number|String} ch4 Color channel value
     *
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setDrawColor
     */
    API.setDrawColor = function(ch1, ch2, ch3, ch4) {
      var color;
      if (ch2 === undefined || (ch4 === undefined && ch1 === ch2 === ch3)) {
        // Gray color space.
        if (typeof ch1 === 'string') {
          color = ch1 + ' G';
        } else {
          color = f2(ch1 / 255) + ' G';
        }
      } else if (ch4 === undefined) {
        // RGB
        if (typeof ch1 === 'string') {
          color = [ch1, ch2, ch3, 'RG'].join(' ');
        } else {
          color = [f2(ch1 / 255), f2(ch2 / 255), f2(ch3 / 255), 'RG'].join(' ');
        }
      } else {
        // CMYK
        if (typeof ch1 === 'string') {
          color = [ch1, ch2, ch3, ch4, 'K'].join(' ');
        } else {
          color = [f2(ch1), f2(ch2), f2(ch3), f2(ch4), 'K'].join(' ');
        }
      }

      out(color);
      return this;
    };

    /**
     * Sets the fill color for upcoming elements.
     *
     * Depending on the number of arguments given, Gray, RGB, or CMYK
     * color space is implied.
     *
     * When only ch1 is given, "Gray" color space is implied and it
     * must be a value in the range from 0.00 (solid black) to to 1.00 (white)
     * if values are communicated as String types, or in range from 0 (black)
     * to 255 (white) if communicated as Number type.
     * The RGB-like 0-255 range is provided for backward compatibility.
     *
     * When only ch1,ch2,ch3 are given, "RGB" color space is implied and each
     * value must be in the range from 0.00 (minimum intensity) to to 1.00
     * (max intensity) if values are communicated as String types, or
     * from 0 (min intensity) to to 255 (max intensity) if values are communicated
     * as Number types.
     * The RGB-like 0-255 range is provided for backward compatibility.
     *
     * When ch1,ch2,ch3,ch4 are given, "CMYK" color space is implied and each
     * value must be a in the range from 0.00 (0% concentration) to to
     * 1.00 (100% concentration)
     *
     * Because JavaScript treats fixed point numbers badly (rounds to
     * floating point nearest to binary representation) it is highly advised to
     * communicate the fractional numbers as String types, not JavaScript Number type.
     *
     * @param {Number|String} ch1 Color channel value
     * @param {Number|String} ch2 Color channel value
     * @param {Number|String} ch3 Color channel value
     * @param {Number|String} ch4 Color channel value
     *
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setFillColor
     */
    API.setFillColor = function(ch1, ch2, ch3, ch4) {
      var color;

      if (ch2 === undefined || (ch4 === undefined && ch1 === ch2 === ch3)) {
        // Gray color space.
        if (typeof ch1 === 'string') {
          color = ch1 + ' g';
        } else {
          color = f2(ch1 / 255) + ' g';
        }
      } else if (ch4 === undefined || typeof ch4 === 'object') {
        // RGB
        if (typeof ch1 === 'string') {
          color = [ch1, ch2, ch3, 'rg'].join(' ');
        } else {
          color = [f2(ch1 / 255), f2(ch2 / 255), f2(ch3 / 255), 'rg'].join(' ');
        }
        if (ch4 && ch4.a === 0){
          //TODO Implement transparency.
          //WORKAROUND use white for now
          color = ['255', '255', '255', 'rg'].join(' ');
        }
      } else {
        // CMYK
        if (typeof ch1 === 'string') {
          color = [ch1, ch2, ch3, ch4, 'k'].join(' ');
        } else {
          color = [f2(ch1), f2(ch2), f2(ch3), f2(ch4), 'k'].join(' ');
        }
      }

      out(color);
      return this;
    };

    /**
     * Sets the text color for upcoming elements.
     * If only one, first argument is given,
     * treats the value as gray-scale color value.
     *
     * @param {Number} r Red channel color value in range 0-255 or {String} r color value in hexadecimal, example: '#FFFFFF'
     * @param {Number} g Green channel color value in range 0-255
     * @param {Number} b Blue channel color value in range 0-255
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setTextColor
     */
    API.setTextColor = function(r, g, b) {
      if ((typeof r === 'string') && /^#[0-9A-Fa-f]{6}$/.test(r)) {
        var hex = parseInt(r.substr(1), 16);
        r = (hex >> 16) & 255;
        g = (hex >> 8) & 255;
        b = (hex & 255);
      }

      if ((r === 0 && g === 0 && b === 0) || (typeof g === 'undefined')) {
        textColor = f3(r / 255) + ' g';
      } else {
        textColor = [f3(r / 255), f3(g / 255), f3(b / 255), 'rg'].join(' ');
      }
      return this;
    };

    /**
     * Is an Object providing a mapping from human-readable to
     * integer flag values designating the varieties of line cap
     * and join styles.
     *
     * @returns {Object}
     * @fieldOf jsPDF#
     * @name CapJoinStyles
     */
    API.CapJoinStyles = {
      0 : 0,
      'butt' : 0,
      'but' : 0,
      'miter' : 0,
      1 : 1,
      'round' : 1,
      'rounded' : 1,
      'circle' : 1,
      2 : 2,
      'projecting' : 2,
      'project' : 2,
      'square' : 2,
      'bevel' : 2
    };

    /**
     * Sets the line cap styles
     * See {jsPDF.CapJoinStyles} for variants
     *
     * @param {String|Number} style A string or number identifying the type of line cap
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setLineCap
     */
    API.setLineCap = function(style) {
      var id = this.CapJoinStyles[style];
      if (id === undefined) {
        throw new Error("Line cap style of '" + style + "' is not recognized. See or extend .CapJoinStyles property for valid styles");
      }
      lineCapID = id;
      out(id + ' J');

      return this;
    };

    /**
     * Sets the line join styles
     * See {jsPDF.CapJoinStyles} for variants
     *
     * @param {String|Number} style A string or number identifying the type of line join
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name setLineJoin
     */
    API.setLineJoin = function(style) {
      var id = this.CapJoinStyles[style];
      if (id === undefined) {
        throw new Error("Line join style of '" + style + "' is not recognized. See or extend .CapJoinStyles property for valid styles");
      }
      lineJoinID = id;
      out(id + ' j');

      return this;
    };

    // Output is both an internal (for plugins) and external function
    API.output = output;

    /**
     * Saves as PDF document. An alias of jsPDF.output('save', 'filename.pdf')
     * @param  {String} filename The filename including extension.
     *
     * @function
     * @returns {jsPDF}
     * @methodOf jsPDF#
     * @name save
     */
    API.save = function(filename) {
      API.output('save', filename);
    };

    // applying plugins (more methods) ON TOP of built-in API.
    // this is intentional as we allow plugins to override
    // built-ins
    for (var plugin in jsPDF.API) {
      if (jsPDF.API.hasOwnProperty(plugin)) {
        if (plugin === 'events' && jsPDF.API.events.length) {
          (function(events, newEvents) {

            // jsPDF.API.events is a JS Array of Arrays
            // where each Array is a pair of event name, handler
            // Events were added by plugins to the jsPDF instantiator.
            // These are always added to the new instance and some ran
            // during instantiation.
            var eventname,handler_and_args,i;

            for (i = newEvents.length - 1; i !== -1; i--) {
              // subscribe takes 3 args: 'topic', function, runonce_flag
              // if undefined, runonce is false.
              // users can attach callback directly,
              // or they can attach an array with [callback, runonce_flag]
              // that's what the "apply" magic is for below.
              eventname = newEvents[i][0];
              handler_and_args = newEvents[i][1];
              events.subscribe.apply(
                events,
                [eventname].concat(
                  typeof handler_and_args === 'function' ?
                    [handler_and_args] : handler_and_args));
            }
          }(events, jsPDF.API.events));
        } else {
          API[plugin] = jsPDF.API[plugin];
        }
      }
    }

    //////////////////////////////////////////////////////
    // continuing initialization of jsPDF Document object
    //////////////////////////////////////////////////////
    // Add the first page automatically
    addFonts();
    activeFontKey = 'F1';
    _addPage(format, orientation);

    events.publish('initialized');
    return API;
  }

  /**
   * jsPDF.API is a STATIC property of jsPDF class.
   * jsPDF.API is an object you can add methods and properties to.
   * The methods / properties you add will show up in new jsPDF objects.
   *
   * One property is prepopulated. It is the 'events' Object. Plugin authors can add topics,
   * callbacks to this object. These will be reassigned to all new instances of jsPDF.
   * Examples:
   * jsPDF.API.events['initialized'] = function(){ 'this' is API object }
   * jsPDF.API.events['addFont'] = function(added_font_object){ 'this' is API object }
   *
   * @static
   * @public
   * @memberOf jsPDF
   * @name API
   *
   * @example
   * jsPDF.API.mymethod = function(){
   *   // 'this' will be ref to internal API object. see jsPDF source
   *   // , so you can refer to built-in methods like so:
   *   //     this.line(....)
   *   //     this.text(....)
   * }
   * var pdfdoc = new jsPDF()
   * pdfdoc.mymethod() // <- !!!!!!
   */
  jsPDF.API = {events:[]};
  jsPDF.version = "1.0.0-trunk";

  if (typeof define === 'function' && define.amd) {
    define('jsPDF', function() {
      return jsPDF;
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = jsPDF;
  } else {
    global.jsPDF = jsPDF;
  }
  return jsPDF;
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this));
/**
 * jsPDF AutoTable plugin
 * Copyright (c) 2014 Simon Bengtsson, https://github.com/someatoms/jsPDF-AutoTable
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function (API) {
    'use strict';

    // On every new jsPDF object, clear variables
    API.events.push(['initialized', function () {
        doc = undefined;
        cellPos = undefined;
        pageCount = 1;
        settings = undefined;
    }], false);

    var MIN_COLUMN_WIDTH = 25;

    var doc, cellPos, pageCount = 1, settings;

    // See README.md or examples for documentation of the options
    // return a new instance every time to avoid references issues
    var defaultOptions = function () {
        return {
            padding: 5,
            fontSize: 10,
            lineHeight: 20,
            renderHeader: function (doc, pageNumber, settings) {
            },
            renderFooter: function (doc, lastCellPos, pageNumber, settings) {
            },
            renderHeaderCell: function (x, y, width, height, key, value, settings) {
                doc.setFillColor(52, 73, 94); // Asphalt
                doc.setTextColor(255, 255, 255);
                doc.setFontStyle('bold');
                doc.rect(x, y, width, height, 'F');
                y += settings.lineHeight / 2 + API.autoTableTextHeight() / 2;
                doc.text(value, x + settings.padding, y);
            },
            renderCell: function (x, y, width, height, key, value, row, settings) {
                doc.setFillColor(row % 2 === 0 ? 245 : 255);
                doc.setTextColor(50);
                doc.rect(x, y, width, height, 'F');
                y += settings.lineHeight / 2 + API.autoTableTextHeight() / 2 - 2.5;
                doc.text(value, x + settings.padding, y);
            },
            margins: {right: 40, left: 40, top: 50, bottom: 40},
            startY: false,
            overflow: 'ellipsize', // false, ellipsize or linebreak (false passes the raw text to renderCell)
            overflowColumns: false, // Specify which colums that gets subjected to the overflow method chosen. false indicates all
            avoidPageSplit: false,
            extendWidth: true
        }
    };

    /**
     * Create a table from a set of rows and columns.
     *
     * @param {Object[]|String[]} columns Either as an array of objects or array of strings
     * @param {Object[][]|String[][]} data Either as an array of objects or array of strings
     * @param {Object} [options={}] Options that will override the default ones (above)
     */
    API.autoTable = function (columns, data, options) {
        options = options || {};
        columns = columns || [];
        doc = this;

        var userFontSize = doc.internal.getFontSize();

        initData({columns: columns, data: data});
        initOptions(options);

        cellPos = {
            x: settings.margins.left,
            y: settings.startY === false ? settings.margins.top : settings.startY
        };

        var tableHeight = settings.margins.bottom + settings.margins.top + settings.lineHeight * (data.length + 1) + 5 + settings.startY;
        if (settings.startY !== false && settings.avoidPageSplit && tableHeight > doc.internal.pageSize.height) {
            pageCount++;
            doc.addPage();
            cellPos.y = settings.margins.top;
        }

        settings.renderHeader(doc, pageCount, settings);
        var columnWidths = calculateColumnWidths(data, columns);
        printHeader(columns, columnWidths);
        printRows(columns, data, columnWidths);
        settings.renderFooter(doc, cellPos, pageCount, settings);

        doc.setFontSize(userFontSize);

        return this;
    };

    /**
     * Returns the Y position of the last drawn cell
     * @returns int
     */
    API.autoTableEndPosY = function () {
        // If cellPos is not set, autoTable() has probably not been called
        return cellPos ? cellPos.y : false;
    };

    /**
     * @deprecated Use autoTableEndPosY()
     */
    API.autoTableEndPos = function () {
        return cellPos;
    };

    /**
     * Parses an html table. To draw a table, use it like this:
     * `doc.autoTable(false, doc.autoTableHtmlToJson(tableDomElem))`
     *
     * @param table Html table element
     * @param indexBased Boolean flag if result should be returned as seperate cols and data
     * @returns []|{} Array of objects with object keys as headers or based on indexes if indexBased is set to true
     */
    API.autoTableHtmlToJson = function (table, indexBased) {
            var data = [], headers = {}, header = table.rows[0], i, tableRow, rowData, j;
        if (indexBased) {
            headers = [];
            for (i = 0; i < header.cells.length; i++) {
                headers.push(header.cells[i] ? header.cells[i].textContent : '');
            }

            for (i = 1; i < table.rows.length; i++) {
                tableRow = table.rows[i];
                rowData = [];
                for (j = 0; j < header.cells.length; j++) {
                    rowData.push(tableRow.cells[j] ? tableRow.cells[j].textContent : '');
                }
                data.push(rowData);
            }
            return {columns: headers, data: data};
        } else {
            for (i = 0; i < header.cells.length; i++) {
                headers[i] = header.cells[i] ? header.cells[i].textContent : '';
            }

            for (i = 1; i < table.rows.length; i++) {
                tableRow = table.rows[i];
                rowData = {};
                for (j = 0; j < header.cells.length; j++) {
                    rowData[headers[j]] = tableRow.cells[j] ? tableRow.cells[j].textContent : '';
                }
                data.push(rowData);
            }

            return data;
        }
    };

    /**
     * Basically the same as getLineHeight() in 1.0+ versions of jsPDF, however
     * added here for backwards compatibility with version 0.9
     *
     * Export it to make it available in drawCell and drawHeaderCell
     */
    API.autoTableTextHeight = function() {
        // The value 1.15 comes from from the jsPDF source code and looks about right
        return doc.internal.getFontSize() * 1.15;
    };

    /**
     * Transform all to the object initialization form
     * @param params
     */
    function initData(params) {

        // Object only initial
        if (!params.columns || params.columns.length === 0) {
            var keys = Object.keys(params.data[0]);
            Array.prototype.push.apply(params.columns, keys);
            params.columns.forEach(function (title, i) {
                params.columns[i] = {title: title, key: keys[i]};
            });
        }
        // Array initialization form
        else if (typeof params.columns[0] === 'string') {
            params.data.forEach(function (row, i) {
                var obj = {};
                for (var j = 0; j < row.length; j++) {
                    obj[j] = params.data[i][j];
                }
                params.data[i] = obj;
            });
            params.columns.forEach(function (title, i) {
                params.columns[i] = {title: title, key: i};
            });
        } else {
            // Use options as is
        }
    }

    function initOptions(raw) {
        settings = defaultOptions();
        Object.keys(raw).forEach(function (key) {
            settings[key] = raw[key];
        });
        doc.setFontSize(settings.fontSize);

        // Backwards compatibility
        if(settings.margins.horizontal !== undefined) {
            settings.margins.left = settings.margins.horizontal;
            settings.margins.right = settings.margins.horizontal;
        } else {
            settings.margins.horizontal = settings.margins.left;
        }
    }

    function calculateColumnWidths(rows, columns) {
        var widths = {};

        // Optimal widths
        var optimalTableWidth = 0;
        columns.forEach(function (header) {
            var widest = getStringWidth(header.title || '', true);
            if(typeof header.width == "number") {
                widest = header.width;
            } else {
                rows.forEach(function (row) {
                    if (!header.hasOwnProperty('key'))
                        throw new Error("The key attribute is required in every header");
                    var w = getStringWidth(stringify(row, header.key));
                    if (w > widest) {
                        widest = w;
                    }
                });
            }
            widths[header.key] = widest;
            optimalTableWidth += widest;
        });

        var paddingAndMargin = settings.padding * 2 * columns.length + settings.margins.left + settings.margins.right;
        var spaceDiff = doc.internal.pageSize.width - optimalTableWidth - paddingAndMargin;

        var keys = Object.keys(widths);
        if (spaceDiff < 0) {
            // Shrink columns
            var shrinkableColumns = [];
            var shrinkableColumnWidths = 0;
            if (settings.overflowColumns === false) {
                keys.forEach(function (key) {
                    if (widths[key] > MIN_COLUMN_WIDTH) {
                        shrinkableColumns.push(key);
                        shrinkableColumnWidths += widths[key];
                    }
                });
            } else {
                shrinkableColumns = settings.overflowColumns;
                shrinkableColumns.forEach(function (col) {
                    shrinkableColumnWidths += widths[col];
                });
            }

            shrinkableColumns.forEach(function (key) {
                widths[key] += spaceDiff * (widths[key] / shrinkableColumnWidths);
            });
        } else if (spaceDiff > 0 && settings.extendWidth) {
            // Fill page horizontally
            keys.forEach(function (key) {
                widths[key] += spaceDiff / keys.length;
            });
        }

        return widths;
    }

    function printHeader(headers, columnWidths) {
        if (!headers) return;

        // First calculate the height of the row
        // (to do that the maxium amount of rows first need to be found)
        var maxRows = 1;
        if (settings.overflow === 'linebreak') {
            // Font style must be the same as in function renderHeaderCell()
            doc.setFontStyle('bold');

            headers.forEach(function (header) {
                if (isOverflowColumn(header)) {
                    var value = header.title || '';
                    var arr = doc.splitTextToSize(value, columnWidths[header.key]);
                    if (arr.length > maxRows) {
                        maxRows = arr.length;
                    }
                }
            });
        }
        var rowHeight = settings.lineHeight + (maxRows - 1) * API.autoTableTextHeight() + 5;

        // Avoid isolated table headers when drawing multiple tables. Add a new page 
        // if cellpos would be at the end of page after drawing the header row
        var newPage = (cellPos.y + settings.margins.bottom + rowHeight * 2) >= doc.internal.pageSize.height;
        if (newPage) {
            settings.renderFooter(doc, cellPos, pageCount, settings);
            doc.addPage();
            cellPos = {x: settings.margins.left, y: settings.margins.top};
            pageCount++;
            settings.renderHeader(doc, pageCount, settings);
        }

        headers.forEach(function (header) {
            var width = columnWidths[header.key] + settings.padding * 2;
            var value = header.title || '';
            if (settings.overflow === 'linebreak') {
                if (isOverflowColumn(header)) {
                    value = doc.splitTextToSize(value, columnWidths[header.key]);
                }
            } else if (settings.overflow === 'ellipsize') {
                value = ellipsize(columnWidths[header.key], value);
            }
            settings.renderHeaderCell(cellPos.x, cellPos.y, width, rowHeight, header.key, value, settings);
            cellPos.x += width;
        });
        doc.setTextColor(70, 70, 70);
        doc.setFontStyle('normal');

        cellPos.y += rowHeight;
        cellPos.x = settings.margins.left;
    }

    function printRows(headers, rows, columnWidths) {
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            // First calculate the height of the row
            // (to do that the maxium amount of rows first need to be found)
            var maxRows = 1;
            if (settings.overflow === 'linebreak') {
                headers.forEach(function (header) {
                    if (isOverflowColumn(header)) {
                        var value = stringify(row, header.key);
                        var arr = doc.splitTextToSize(value, columnWidths[header.key]);
                        if (arr.length > maxRows) {
                            maxRows = arr.length;
                        }
                    }
                });
            }
            var rowHeight = settings.lineHeight + (maxRows - 1) * API.autoTableTextHeight();


            // Render the cell
            headers.forEach(function (header) {
                var value = stringify(row, header.key);
                if (settings.overflow === 'linebreak') {
                    if (isOverflowColumn(header)) {
                        value = doc.splitTextToSize(value, columnWidths[header.key]);
                    }
                } else if (settings.overflow === 'ellipsize') {
                    value = ellipsize(columnWidths[header.key], value);
                }
                var width = columnWidths[header.key] + settings.padding * 2;
                settings.renderCell(cellPos.x, cellPos.y, width, rowHeight, header.key, value, i, settings);
                cellPos.x = cellPos.x + columnWidths[header.key] + settings.padding * 2;
            });

            // Add a new page if cellpos is at the end of page
            var newPage = (cellPos.y + settings.margins.bottom + rowHeight * 2) >= doc.internal.pageSize.height;
            if (newPage) {
                if (i+1 < rows.length) {
                    settings.renderFooter(doc, cellPos, pageCount, settings);
                    doc.addPage();
                    cellPos = {x: settings.margins.left, y: settings.margins.top};
                    pageCount++;
                    settings.renderHeader(doc, pageCount, settings);
                    printHeader(headers, columnWidths);
                }
            } else {
                cellPos.y += rowHeight;
                cellPos.x = settings.margins.left;
            }
        }
    }

    function isOverflowColumn(header) {
        return settings.overflowColumns === false || settings.overflowColumns.indexOf(header.key) !== -1;
    }

    /**
     * Ellipsize the text to fit in the width
     * @param width
     * @param text
     */
    function ellipsize(width, text) {
        if (width >= getStringWidth(text)) {
            return text;
        }
        while (width < getStringWidth(text + "...")) {
            if (text.length < 2) {
                break;
            }
            text = text.substring(0, text.length - 1);
        }
        text += "...";
        return text;
    }

    function stringify(row, key) {
        return row.hasOwnProperty(key) ? '' + row[key] : '';
    }

    function getStringWidth(txt, isBold) {
        if(isBold) {
            doc.setFontStyle('bold');
        }
        var strWidth = doc.getStringUnitWidth(txt) * doc.internal.getFontSize();
        if(isBold) {
            doc.setFontStyle('normal');
        }
        return strWidth;
    }

})(jsPDF.API);

/** @preserve
 * jsPDF split_text_to_size plugin - MIT license.
 * Copyright (c) 2012 Willow Systems Corporation, willow-systems.com
 *               2014 Diego Casorran, https://github.com/diegocr
 */
/**
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

;(function(API) {
'use strict'

/**
Returns an array of length matching length of the 'word' string, with each
cell ocupied by the width of the char in that position.

@function
@param word {String}
@param widths {Object}
@param kerning {Object}
@returns {Array}
*/
var getCharWidthsArray = API.getCharWidthsArray = function(text, options){

	if (!options) {
		options = {}
	}

	var widths = options.widths ? options.widths : this.internal.getFont().metadata.Unicode.widths
	, widthsFractionOf = widths.fof ? widths.fof : 1
	, kerning = options.kerning ? options.kerning : this.internal.getFont().metadata.Unicode.kerning
	, kerningFractionOf = kerning.fof ? kerning.fof : 1

	// console.log("widths, kergnings", widths, kerning)

	var i, l
	, char_code
	, prior_char_code = 0 // for kerning
	, default_char_width = widths[0] || widthsFractionOf
	, output = []

	for (i = 0, l = text.length; i < l; i++) {
		char_code = text.charCodeAt(i)
		output.push(
			( widths[char_code] || default_char_width ) / widthsFractionOf +
			( kerning[char_code] && kerning[char_code][prior_char_code] || 0 ) / kerningFractionOf
		)
		prior_char_code = char_code
	}

	return output
}
var getArraySum = function(array){
	var i = array.length
	, output = 0
	while(i){
		;i--;
		output += array[i]
	}
	return output
}
/**
Returns a widths of string in a given font, if the font size is set as 1 point.

In other words, this is "proportional" value. For 1 unit of font size, the length
of the string will be that much.

Multiply by font size to get actual width in *points*
Then divide by 72 to get inches or divide by (72/25.6) to get 'mm' etc.

@public
@function
@param
@returns {Type}
*/
var getStringUnitWidth = API.getStringUnitWidth = function(text, options) {
	return getArraySum(getCharWidthsArray.call(this, text, options))
}

/**
returns array of lines
*/
var splitLongWord = function(word, widths_array, firstLineMaxLen, maxLen){
	var answer = []

	// 1st, chop off the piece that can fit on the hanging line.
	var i = 0
	, l = word.length
	, workingLen = 0
	while (i !== l && workingLen + widths_array[i] < firstLineMaxLen){
		workingLen += widths_array[i]
		;i++;
	}
	// this is first line.
	answer.push(word.slice(0, i))

	// 2nd. Split the rest into maxLen pieces.
	var startOfLine = i
	workingLen = 0
	while (i !== l){
		if (workingLen + widths_array[i] > maxLen) {
			answer.push(word.slice(startOfLine, i))
			workingLen = 0
			startOfLine = i
		}
		workingLen += widths_array[i]
		;i++;
	}
	if (startOfLine !== i) {
		answer.push(word.slice(startOfLine, i))
	}

	return answer
}

// Note, all sizing inputs for this function must be in "font measurement units"
// By default, for PDF, it's "point".
var splitParagraphIntoLines = function(text, maxlen, options){
	// at this time works only on Western scripts, ones with space char
	// separating the words. Feel free to expand.

	if (!options) {
		options = {}
	}

	var line = []
	, lines = [line]
	, line_length = options.textIndent || 0
	, separator_length = 0
	, current_word_length = 0
	, word
	, widths_array
	, words = text.split(' ')
	, spaceCharWidth = getCharWidthsArray(' ', options)[0]
	, i, l, tmp, lineIndent

	if(options.lineIndent === -1) {
		lineIndent = words[0].length +2;
	} else {
		lineIndent = options.lineIndent || 0;
	}
	if(lineIndent) {
		var pad = Array(lineIndent).join(" "), wrds = [];
		words.map(function(wrd) {
			wrd = wrd.split(/\s*\n/);
			if(wrd.length > 1) {
				wrds = wrds.concat(wrd.map(function(wrd, idx) {
					return (idx && wrd.length ? "\n":"") + wrd;
				}));
			} else {
				wrds.push(wrd[0]);
			}
		});
		words = wrds;
		lineIndent = getStringUnitWidth(pad, options);
	}

	for (i = 0, l = words.length; i < l; i++) {
		var force = 0;

		word = words[i]
		if(lineIndent && word[0] == "\n") {
			word = word.substr(1);
			force = 1;
		}
		widths_array = getCharWidthsArray(word, options)
		current_word_length = getArraySum(widths_array)

		if (line_length + separator_length + current_word_length > maxlen || force) {
			if (current_word_length > maxlen) {
				// this happens when you have space-less long URLs for example.
				// we just chop these to size. We do NOT insert hiphens
				tmp = splitLongWord(word, widths_array, maxlen - (line_length + separator_length), maxlen)
				// first line we add to existing line object
				line.push(tmp.shift()) // it's ok to have extra space indicator there
				// last line we make into new line object
				line = [tmp.pop()]
				// lines in the middle we apped to lines object as whole lines
				while(tmp.length){
					lines.push([tmp.shift()]) // single fragment occupies whole line
				}
				current_word_length = getArraySum( widths_array.slice(word.length - line[0].length) )
			} else {
				// just put it on a new line
				line = [word]
			}

			// now we attach new line to lines
			lines.push(line)
			line_length = current_word_length + lineIndent
			separator_length = spaceCharWidth

		} else {
			line.push(word)

			line_length += separator_length + current_word_length
			separator_length = spaceCharWidth
		}
	}

	if(lineIndent) {
		var postProcess = function(ln, idx) {
			return (idx ? pad : '') + ln.join(" ");
		};
	} else {
		var postProcess = function(ln) { return ln.join(" ")};
	}

	return lines.map(postProcess);
}

/**
Splits a given string into an array of strings. Uses 'size' value
(in measurement units declared as default for the jsPDF instance)
and the font's "widths" and "Kerning" tables, where availabe, to
determine display length of a given string for a given font.

We use character's 100% of unit size (height) as width when Width
table or other default width is not available.

@public
@function
@param text {String} Unencoded, regular JavaScript (Unicode, UTF-16 / UCS-2) string.
@param size {Number} Nominal number, measured in units default to this instance of jsPDF.
@param options {Object} Optional flags needed for chopper to do the right thing.
@returns {Array} with strings chopped to size.
*/
API.splitTextToSize = function(text, maxlen, options) {
	'use strict'

	if (!options) {
		options = {}
	}

	var fsize = options.fontSize || this.internal.getFontSize()
	, newOptions = (function(options){
		var widths = {0:1}
		, kerning = {}

		if (!options.widths || !options.kerning) {
			var f = this.internal.getFont(options.fontName, options.fontStyle)
			, encoding = 'Unicode'
			// NOT UTF8, NOT UTF16BE/LE, NOT UCS2BE/LE
			// Actual JavaScript-native String's 16bit char codes used.
			// no multi-byte logic here

			if (f.metadata[encoding]) {
				return {
					widths: f.metadata[encoding].widths || widths
					, kerning: f.metadata[encoding].kerning || kerning
				}
			}
		} else {
			return 	{
				widths: options.widths
				, kerning: options.kerning
			}
		}

		// then use default values
		return 	{
			widths: widths
			, kerning: kerning
		}
	}).call(this, options)

	// first we split on end-of-line chars
	var paragraphs
	if(Array.isArray(text)) {
		paragraphs = text;
	} else {
		paragraphs = text.split(/\r?\n/);
	}

	// now we convert size (max length of line) into "font size units"
	// at present time, the "font size unit" is always 'point'
	// 'proportional' means, "in proportion to font size"
	var fontUnit_maxLen = 1.0 * this.internal.scaleFactor * maxlen / fsize
	// at this time, fsize is always in "points" regardless of the default measurement unit of the doc.
	// this may change in the future?
	// until then, proportional_maxlen is likely to be in 'points'

	// If first line is to be indented (shorter or longer) than maxLen
	// we indicate that by using CSS-style "text-indent" option.
	// here it's in font units too (which is likely 'points')
	// it can be negative (which makes the first line longer than maxLen)
	newOptions.textIndent = options.textIndent ?
		options.textIndent * 1.0 * this.internal.scaleFactor / fsize :
		0
	newOptions.lineIndent = options.lineIndent;

	var i, l
	, output = []
	for (i = 0, l = paragraphs.length; i < l; i++) {
		output = output.concat(
			splitParagraphIntoLines(
				paragraphs[i]
				, fontUnit_maxLen
				, newOptions
			)
		)
	}

	return output
}

})(jsPDF.API);

/** @preserve 
jsPDF standard_fonts_metrics plugin
Copyright (c) 2012 Willow Systems Corporation, willow-systems.com
MIT license.
*/
/**
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

;(function(API) {
'use strict'

/*
# reference (Python) versions of 'compress' and 'uncompress'
# only 'uncompress' function is featured lower as JavaScript
# if you want to unit test "roundtrip", just transcribe the reference
# 'compress' function from Python into JavaScript

def compress(data):

	keys =   '0123456789abcdef'
	values = 'klmnopqrstuvwxyz'
	mapping = dict(zip(keys, values))
	vals = []
	for key in data.keys():
		value = data[key]
		try:
			keystring = hex(key)[2:]
			keystring = keystring[:-1] + mapping[keystring[-1:]]
		except:
			keystring = key.join(["'","'"])
			#print('Keystring is %s' % keystring)

		try:
			if value < 0:
				valuestring = hex(value)[3:]
				numberprefix = '-'
			else:
				valuestring = hex(value)[2:]
				numberprefix = ''
			valuestring = numberprefix + valuestring[:-1] + mapping[valuestring[-1:]]
		except:
			if type(value) == dict:
				valuestring = compress(value)
			else:
				raise Exception("Don't know what to do with value type %s" % type(value))

		vals.append(keystring+valuestring)
	
	return '{' + ''.join(vals) + '}'

def uncompress(data):

	decoded = '0123456789abcdef'
	encoded = 'klmnopqrstuvwxyz'
	mapping = dict(zip(encoded, decoded))

	sign = +1
	stringmode = False
	stringparts = []

	output = {}

	activeobject = output
	parentchain = []

	keyparts = ''
	valueparts = ''

	key = None

	ending = set(encoded)

	i = 1
	l = len(data) - 1 # stripping starting, ending {}
	while i != l: # stripping {}
		# -, {, }, ' are special.

		ch = data[i]
		i += 1

		if ch == "'":
			if stringmode:
				# end of string mode
				stringmode = False
				key = ''.join(stringparts)
			else:
				# start of string mode
				stringmode = True
				stringparts = []
		elif stringmode == True:
			#print("Adding %s to stringpart" % ch)
			stringparts.append(ch)

		elif ch == '{':
			# start of object
			parentchain.append( [activeobject, key] )
			activeobject = {}
			key = None
			#DEBUG = True
		elif ch == '}':
			# end of object
			parent, key = parentchain.pop()
			parent[key] = activeobject
			key = None
			activeobject = parent
			#DEBUG = False

		elif ch == '-':
			sign = -1
		else:
			# must be number
			if key == None:
				#debug("In Key. It is '%s', ch is '%s'" % (keyparts, ch))
				if ch in ending:
					#debug("End of key")
					keyparts += mapping[ch]
					key = int(keyparts, 16) * sign
					sign = +1
					keyparts = ''
				else:
					keyparts += ch
			else:
				#debug("In value. It is '%s', ch is '%s'" % (valueparts, ch))
				if ch in ending:
					#debug("End of value")
					valueparts += mapping[ch]
					activeobject[key] = int(valueparts, 16) * sign
					sign = +1
					key = None
					valueparts = ''
				else:
					valueparts += ch

			#debug(activeobject)

	return output

*/

/**
Uncompresses data compressed into custom, base16-like format. 
@public
@function
@param
@returns {Type}
*/
var uncompress = function(data){

	var decoded = '0123456789abcdef'
	, encoded = 'klmnopqrstuvwxyz'
	, mapping = {}

	for (var i = 0; i < encoded.length; i++){
		mapping[encoded[i]] = decoded[i]
	}

	var undef
	, output = {}
	, sign = 1
	, stringparts // undef. will be [] in string mode
	
	, activeobject = output
	, parentchain = []
	, parent_key_pair
	, keyparts = ''
	, valueparts = ''
	, key // undef. will be Truthy when Key is resolved.
	, datalen = data.length - 1 // stripping ending }
	, ch

	i = 1 // stripping starting {
	
	while (i != datalen){
		// - { } ' are special.

		ch = data[i]
		i += 1

		if (ch == "'"){
			if (stringparts){
				// end of string mode
				key = stringparts.join('')
				stringparts = undef				
			} else {
				// start of string mode
				stringparts = []				
			}
		} else if (stringparts){
			stringparts.push(ch)
		} else if (ch == '{'){
			// start of object
			parentchain.push( [activeobject, key] )
			activeobject = {}
			key = undef
		} else if (ch == '}'){
			// end of object
			parent_key_pair = parentchain.pop()
			parent_key_pair[0][parent_key_pair[1]] = activeobject
			key = undef
			activeobject = parent_key_pair[0]
		} else if (ch == '-'){
			sign = -1
		} else {
			// must be number
			if (key === undef) {
				if (mapping.hasOwnProperty(ch)){
					keyparts += mapping[ch]
					key = parseInt(keyparts, 16) * sign
					sign = +1
					keyparts = ''
				} else {
					keyparts += ch
				}
			} else {
				if (mapping.hasOwnProperty(ch)){
					valueparts += mapping[ch]
					activeobject[key] = parseInt(valueparts, 16) * sign
					sign = +1
					key = undef
					valueparts = ''
				} else {
					valueparts += ch					
				}
			}
		}
	} // end while

	return output
}

// encoding = 'Unicode' 
// NOT UTF8, NOT UTF16BE/LE, NOT UCS2BE/LE. NO clever BOM behavior
// Actual 16bit char codes used.
// no multi-byte logic here

// Unicode characters to WinAnsiEncoding:
// {402: 131, 8211: 150, 8212: 151, 8216: 145, 8217: 146, 8218: 130, 8220: 147, 8221: 148, 8222: 132, 8224: 134, 8225: 135, 8226: 149, 8230: 133, 8364: 128, 8240:137, 8249: 139, 8250: 155, 710: 136, 8482: 153, 338: 140, 339: 156, 732: 152, 352: 138, 353: 154, 376: 159, 381: 142, 382: 158}
// as you can see, all Unicode chars are outside of 0-255 range. No char code conflicts.
// this means that you can give Win cp1252 encoded strings to jsPDF for rendering directly
// as well as give strings with some (supported by these fonts) Unicode characters and 
// these will be mapped to win cp1252 
// for example, you can send char code (cp1252) 0x80 or (unicode) 0x20AC, getting "Euro" glyph displayed in both cases.

var encodingBlock = {
	'codePages': ['WinAnsiEncoding']
	, 'WinAnsiEncoding': uncompress("{19m8n201n9q201o9r201s9l201t9m201u8m201w9n201x9o201y8o202k8q202l8r202m9p202q8p20aw8k203k8t203t8v203u9v2cq8s212m9t15m8w15n9w2dw9s16k8u16l9u17s9z17x8y17y9y}")
}
, encodings = {'Unicode':{
	'Courier': encodingBlock
	, 'Courier-Bold': encodingBlock
	, 'Courier-BoldOblique': encodingBlock
	, 'Courier-Oblique': encodingBlock
	, 'Helvetica': encodingBlock
	, 'Helvetica-Bold': encodingBlock
	, 'Helvetica-BoldOblique': encodingBlock
	, 'Helvetica-Oblique': encodingBlock
	, 'Times-Roman': encodingBlock
	, 'Times-Bold': encodingBlock
	, 'Times-BoldItalic': encodingBlock
	, 'Times-Italic': encodingBlock
//	, 'Symbol'
//	, 'ZapfDingbats'
}}
/** 
Resources:
Font metrics data is reprocessed derivative of contents of
"Font Metrics for PDF Core 14 Fonts" package, which exhibits the following copyright and license:

Copyright (c) 1989, 1990, 1991, 1992, 1993, 1997 Adobe Systems Incorporated. All Rights Reserved.

This file and the 14 PostScript(R) AFM files it accompanies may be used,
copied, and distributed for any purpose and without charge, with or without
modification, provided that all copyright notices are retained; that the AFM
files are not distributed without this file; that all modifications to this
file or any of the AFM files are prominently noted in the modified file(s);
and that this paragraph is not modified. Adobe Systems has no responsibility
or obligation to support the use of the AFM files.

*/
, fontMetrics = {'Unicode':{
	// all sizing numbers are n/fontMetricsFractionOf = one font size unit
	// this means that if fontMetricsFractionOf = 1000, and letter A's width is 476, it's
	// width is 476/1000 or 47.6% of its height (regardless of font size)
	// At this time this value applies to "widths" and "kerning" numbers.

	// char code 0 represents "default" (average) width - use it for chars missing in this table.
	// key 'fof' represents the "fontMetricsFractionOf" value

	'Courier-Oblique': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}")
	, 'Times-BoldItalic': uncompress("{'widths'{k3o2q4ycx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2r202m2n2n3m2o3m2p5n202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5n4l4m4m4m4n4m4o4s4p4m4q4m4r4s4s4y4t2r4u3m4v4m4w3x4x5t4y4s4z4s5k3x5l4s5m4m5n3r5o3x5p4s5q4m5r5t5s4m5t3x5u3x5v2l5w1w5x2l5y3t5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q2l6r3m6s3r6t1w6u1w6v3m6w1w6x4y6y3r6z3m7k3m7l3m7m2r7n2r7o1w7p3r7q2w7r4m7s3m7t2w7u2r7v2n7w1q7x2n7y3t202l3mcl4mal2ram3man3mao3map3mar3mas2lat4uau1uav3maw3way4uaz2lbk2sbl3t'fof'6obo2lbp3tbq3mbr1tbs2lbu1ybv3mbz3mck4m202k3mcm4mcn4mco4mcp4mcq5ycr4mcs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz2w203k6o212m6o2dw2l2cq2l3t3m3u2l17s3x19m3m}'kerning'{cl{4qu5kt5qt5rs17ss5ts}201s{201ss}201t{cks4lscmscnscoscpscls2wu2yu201ts}201x{2wu2yu}2k{201ts}2w{4qx5kx5ou5qx5rs17su5tu}2x{17su5tu5ou}2y{4qx5kx5ou5qx5rs17ss5ts}'fof'-6ofn{17sw5tw5ou5qw5rs}7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qs}3v{17su5tu5os5qs}7p{17su5tu}ck{4qu5kt5qt5rs17ss5ts}4l{4qu5kt5qt5rs17ss5ts}cm{4qu5kt5qt5rs17ss5ts}cn{4qu5kt5qt5rs17ss5ts}co{4qu5kt5qt5rs17ss5ts}cp{4qu5kt5qt5rs17ss5ts}6l{4qu5ou5qw5rt17su5tu}5q{ckuclucmucnucoucpu4lu}5r{ckuclucmucnucoucpu4lu}7q{cksclscmscnscoscps4ls}6p{4qu5ou5qw5rt17sw5tw}ek{4qu5ou5qw5rt17su5tu}el{4qu5ou5qw5rt17su5tu}em{4qu5ou5qw5rt17su5tu}en{4qu5ou5qw5rt17su5tu}eo{4qu5ou5qw5rt17su5tu}ep{4qu5ou5qw5rt17su5tu}es{17ss5ts5qs4qu}et{4qu5ou5qw5rt17sw5tw}eu{4qu5ou5qw5rt17ss5ts}ev{17ss5ts5qs4qu}6z{17sw5tw5ou5qw5rs}fm{17sw5tw5ou5qw5rs}7n{201ts}fo{17sw5tw5ou5qw5rs}fp{17sw5tw5ou5qw5rs}fq{17sw5tw5ou5qw5rs}7r{cksclscmscnscoscps4ls}fs{17sw5tw5ou5qw5rs}ft{17su5tu}fu{17su5tu}fv{17su5tu}fw{17su5tu}fz{cksclscmscnscoscps4ls}}}")
	, 'Helvetica-Bold': uncompress("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}")
	, 'Courier': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}")
	, 'Courier-BoldOblique': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}")
	, 'Times-Bold': uncompress("{'widths'{k3q2q5ncx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2l202m2n2n3m2o3m2p6o202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5x4l4s4m4m4n4s4o4s4p4m4q3x4r4y4s4y4t2r4u3m4v4y4w4m4x5y4y4s4z4y5k3x5l4y5m4s5n3r5o4m5p4s5q4s5r6o5s4s5t4s5u4m5v2l5w1w5x2l5y3u5z3m6k2l6l3m6m3r6n2w6o3r6p2w6q2l6r3m6s3r6t1w6u2l6v3r6w1w6x5n6y3r6z3m7k3r7l3r7m2w7n2r7o2l7p3r7q3m7r4s7s3m7t3m7u2w7v2r7w1q7x2r7y3o202l3mcl4sal2lam3man3mao3map3mar3mas2lat4uau1yav3maw3tay4uaz2lbk2sbl3t'fof'6obo2lbp3rbr1tbs2lbu2lbv3mbz3mck4s202k3mcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3rek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3m3u2l17s4s19m3m}'kerning'{cl{4qt5ks5ot5qy5rw17sv5tv}201t{cks4lscmscnscoscpscls4wv}2k{201ts}2w{4qu5ku7mu5os5qx5ru17su5tu}2x{17su5tu5ou5qs}2y{4qv5kv7mu5ot5qz5ru17su5tu}'fof'-6o7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qu}3v{17su5tu5os5qu}fu{17su5tu5ou5qu}7p{17su5tu5ou5qu}ck{4qt5ks5ot5qy5rw17sv5tv}4l{4qt5ks5ot5qy5rw17sv5tv}cm{4qt5ks5ot5qy5rw17sv5tv}cn{4qt5ks5ot5qy5rw17sv5tv}co{4qt5ks5ot5qy5rw17sv5tv}cp{4qt5ks5ot5qy5rw17sv5tv}6l{17st5tt5ou5qu}17s{ckuclucmucnucoucpu4lu4wu}5o{ckuclucmucnucoucpu4lu4wu}5q{ckzclzcmzcnzcozcpz4lz4wu}5r{ckxclxcmxcnxcoxcpx4lx4wu}5t{ckuclucmucnucoucpu4lu4wu}7q{ckuclucmucnucoucpu4lu}6p{17sw5tw5ou5qu}ek{17st5tt5qu}el{17st5tt5ou5qu}em{17st5tt5qu}en{17st5tt5qu}eo{17st5tt5qu}ep{17st5tt5ou5qu}es{17ss5ts5qu}et{17sw5tw5ou5qu}eu{17sw5tw5ou5qu}ev{17ss5ts5qu}6z{17sw5tw5ou5qu5rs}fm{17sw5tw5ou5qu5rs}fn{17sw5tw5ou5qu5rs}fo{17sw5tw5ou5qu5rs}fp{17sw5tw5ou5qu5rs}fq{17sw5tw5ou5qu5rs}7r{cktcltcmtcntcotcpt4lt5os}fs{17sw5tw5ou5qu5rs}ft{17su5tu5ou5qu}7m{5os}fv{17su5tu5ou5qu}fw{17su5tu5ou5qu}fz{cksclscmscnscoscps4ls}}}")
	//, 'Symbol': uncompress("{'widths'{k3uaw4r19m3m2k1t2l2l202m2y2n3m2p5n202q6o3k3m2s2l2t2l2v3r2w1t3m3m2y1t2z1wbk2sbl3r'fof'6o3n3m3o3m3p3m3q3m3r3m3s3m3t3m3u1w3v1w3w3r3x3r3y3r3z2wbp3t3l3m5v2l5x2l5z3m2q4yfr3r7v3k7w1o7x3k}'kerning'{'fof'-6o}}")
	, 'Helvetica': uncompress("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}")
	, 'Helvetica-BoldOblique': uncompress("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}")
	//, 'ZapfDingbats': uncompress("{'widths'{k4u2k1w'fof'6o}'kerning'{'fof'-6o}}")
	, 'Courier-Bold': uncompress("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}")
	, 'Times-Italic': uncompress("{'widths'{k3n2q4ycx2l201n3m201o5t201s2l201t2l201u2l201w3r201x3r201y3r2k1t2l2l202m2n2n3m2o3m2p5n202q5t2r1p2s2l2t2l2u3m2v4n2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w4n3x4n3y4n3z3m4k5w4l3x4m3x4n4m4o4s4p3x4q3x4r4s4s4s4t2l4u2w4v4m4w3r4x5n4y4m4z4s5k3x5l4s5m3x5n3m5o3r5p4s5q3x5r5n5s3x5t3r5u3r5v2r5w1w5x2r5y2u5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q1w6r3m6s3m6t1w6u1w6v2w6w1w6x4s6y3m6z3m7k3m7l3m7m2r7n2r7o1w7p3m7q2w7r4m7s2w7t2w7u2r7v2s7w1v7x2s7y3q202l3mcl3xal2ram3man3mao3map3mar3mas2lat4wau1vav3maw4nay4waz2lbk2sbl4n'fof'6obo2lbp3mbq3obr1tbs2lbu1zbv3mbz3mck3x202k3mcm3xcn3xco3xcp3xcq5tcr4mcs3xct3xcu3xcv3xcw2l2m2ucy2lcz2ldl4mdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr4nfs3mft3mfu3mfv3mfw3mfz2w203k6o212m6m2dw2l2cq2l3t3m3u2l17s3r19m3m}'kerning'{cl{5kt4qw}201s{201sw}201t{201tw2wy2yy6q-t}201x{2wy2yy}2k{201tw}2w{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}2x{17ss5ts5os}2y{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}'fof'-6o6t{17ss5ts5qs}7t{5os}3v{5qs}7p{17su5tu5qs}ck{5kt4qw}4l{5kt4qw}cm{5kt4qw}cn{5kt4qw}co{5kt4qw}cp{5kt4qw}6l{4qs5ks5ou5qw5ru17su5tu}17s{2ks}5q{ckvclvcmvcnvcovcpv4lv}5r{ckuclucmucnucoucpu4lu}5t{2ks}6p{4qs5ks5ou5qw5ru17su5tu}ek{4qs5ks5ou5qw5ru17su5tu}el{4qs5ks5ou5qw5ru17su5tu}em{4qs5ks5ou5qw5ru17su5tu}en{4qs5ks5ou5qw5ru17su5tu}eo{4qs5ks5ou5qw5ru17su5tu}ep{4qs5ks5ou5qw5ru17su5tu}es{5ks5qs4qs}et{4qs5ks5ou5qw5ru17su5tu}eu{4qs5ks5qw5ru17su5tu}ev{5ks5qs4qs}ex{17ss5ts5qs}6z{4qv5ks5ou5qw5ru17su5tu}fm{4qv5ks5ou5qw5ru17su5tu}fn{4qv5ks5ou5qw5ru17su5tu}fo{4qv5ks5ou5qw5ru17su5tu}fp{4qv5ks5ou5qw5ru17su5tu}fq{4qv5ks5ou5qw5ru17su5tu}7r{5os}fs{4qv5ks5ou5qw5ru17su5tu}ft{17su5tu5qs}fu{17su5tu5qs}fv{17su5tu5qs}fw{17su5tu5qs}}}")
	, 'Times-Roman': uncompress("{'widths'{k3n2q4ycx2l201n3m201o6o201s2l201t2l201u2l201w2w201x2w201y2w2k1t2l2l202m2n2n3m2o3m2p5n202q6o2r1m2s2l2t2l2u3m2v3s2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v1w3w3s3x3s3y3s3z2w4k5w4l4s4m4m4n4m4o4s4p3x4q3r4r4s4s4s4t2l4u2r4v4s4w3x4x5t4y4s4z4s5k3r5l4s5m4m5n3r5o3x5p4s5q4s5r5y5s4s5t4s5u3x5v2l5w1w5x2l5y2z5z3m6k2l6l2w6m3m6n2w6o3m6p2w6q2l6r3m6s3m6t1w6u1w6v3m6w1w6x4y6y3m6z3m7k3m7l3m7m2l7n2r7o1w7p3m7q3m7r4s7s3m7t3m7u2w7v3k7w1o7x3k7y3q202l3mcl4sal2lam3man3mao3map3mar3mas2lat4wau1vav3maw3say4waz2lbk2sbl3s'fof'6obo2lbp3mbq2xbr1tbs2lbu1zbv3mbz2wck4s202k3mcm4scn4sco4scp4scq5tcr4mcs3xct3xcu3xcv3xcw2l2m2tcy2lcz2ldl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek2wel2wem2wen2weo2wep2weq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr3sfs3mft3mfu3mfv3mfw3mfz3m203k6o212m6m2dw2l2cq2l3t3m3u1w17s4s19m3m}'kerning'{cl{4qs5ku17sw5ou5qy5rw201ss5tw201ws}201s{201ss}201t{ckw4lwcmwcnwcowcpwclw4wu201ts}2k{201ts}2w{4qs5kw5os5qx5ru17sx5tx}2x{17sw5tw5ou5qu}2y{4qs5kw5os5qx5ru17sx5tx}'fof'-6o7t{ckuclucmucnucoucpu4lu5os5rs}3u{17su5tu5qs}3v{17su5tu5qs}7p{17sw5tw5qs}ck{4qs5ku17sw5ou5qy5rw201ss5tw201ws}4l{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cm{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cn{4qs5ku17sw5ou5qy5rw201ss5tw201ws}co{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cp{4qs5ku17sw5ou5qy5rw201ss5tw201ws}6l{17su5tu5os5qw5rs}17s{2ktclvcmvcnvcovcpv4lv4wuckv}5o{ckwclwcmwcnwcowcpw4lw4wu}5q{ckyclycmycnycoycpy4ly4wu5ms}5r{cktcltcmtcntcotcpt4lt4ws}5t{2ktclvcmvcnvcovcpv4lv4wuckv}7q{cksclscmscnscoscps4ls}6p{17su5tu5qw5rs}ek{5qs5rs}el{17su5tu5os5qw5rs}em{17su5tu5os5qs5rs}en{17su5qs5rs}eo{5qs5rs}ep{17su5tu5os5qw5rs}es{5qs}et{17su5tu5qw5rs}eu{17su5tu5qs5rs}ev{5qs}6z{17sv5tv5os5qx5rs}fm{5os5qt5rs}fn{17sv5tv5os5qx5rs}fo{17sv5tv5os5qx5rs}fp{5os5qt5rs}fq{5os5qt5rs}7r{ckuclucmucnucoucpu4lu5os}fs{17sv5tv5os5qx5rs}ft{17ss5ts5qs}fu{17sw5tw5qs}fv{17sw5tw5qs}fw{17ss5ts5qs}fz{ckuclucmucnucoucpu4lu5os5rs}}}")
	, 'Helvetica-Oblique': uncompress("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}")
}};

/*
This event handler is fired when a new jsPDF object is initialized
This event handler appends metrics data to standard fonts within
that jsPDF instance. The metrics are mapped over Unicode character
codes, NOT CIDs or other codes matching the StandardEncoding table of the
standard PDF fonts.
Future:
Also included is the encoding maping table, converting Unicode (UCS-2, UTF-16)
char codes to StandardEncoding character codes. The encoding table is to be used
somewhere around "pdfEscape" call.
*/

API.events.push([ 
	'addFonts'
	,function(fontManagementObjects) {
		// fontManagementObjects is {
		//	'fonts':font_ID-keyed hash of font objects
		//	, 'dictionary': lookup object, linking ["FontFamily"]['Style'] to font ID
		//}
		var font
		, fontID
		, metrics
		, unicode_section
		, encoding = 'Unicode'
		, encodingBlock

		for (fontID in fontManagementObjects.fonts){
			if (fontManagementObjects.fonts.hasOwnProperty(fontID)) {
				font = fontManagementObjects.fonts[fontID]

				// // we only ship 'Unicode' mappings and metrics. No need for loop.
				// // still, leaving this for the future.

				// for (encoding in fontMetrics){
				// 	if (fontMetrics.hasOwnProperty(encoding)) {

						metrics = fontMetrics[encoding][font.PostScriptName]
						if (metrics) {
							if (font.metadata[encoding]) {
								unicode_section = font.metadata[encoding]
							} else {
								unicode_section = font.metadata[encoding] = {}
							}

							unicode_section.widths = metrics.widths
							unicode_section.kerning = metrics.kerning
						}
				// 	}
				// }
				// for (encoding in encodings){
				// 	if (encodings.hasOwnProperty(encoding)) {
						encodingBlock = encodings[encoding][font.PostScriptName]
						if (encodingBlock) {
							if (font.metadata[encoding]) {
								unicode_section = font.metadata[encoding]
							} else {
								unicode_section = font.metadata[encoding] = {}
							}

							unicode_section.encoding = encodingBlock
							if (encodingBlock.codePages && encodingBlock.codePages.length) {
								font.encoding = encodingBlock.codePages[0]
							}
						}
				// 	}
				// }
			}
		}
	}
]) // end of adding event handler

})(jsPDF.API);

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||function(e){"use strict";if("undefined"==typeof navigator||!/MSIE [1-9]\./.test(navigator.userAgent)){var t=e.document,n=function(){return e.URL||e.webkitURL||e},o=t.createElementNS("http://www.w3.org/1999/xhtml","a"),r="download"in o,i=function(n){var o=t.createEvent("MouseEvents");o.initMouseEvent("click",!0,!1,e,0,0,0,0,0,!1,!1,!1,!1,0,null),n.dispatchEvent(o)},a=e.webkitRequestFileSystem,c=e.requestFileSystem||a||e.mozRequestFileSystem,u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},f="application/octet-stream",s=0,d=500,l=function(t){var o=function(){"string"==typeof t?n().revokeObjectURL(t):t.remove()};e.chrome?o():setTimeout(o,d)},v=function(e,t,n){t=[].concat(t);for(var o=t.length;o--;){var r=e["on"+t[o]];if("function"==typeof r)try{r.call(e,n||e)}catch(i){u(i)}}},p=function(e){return/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\ufeff",e],{type:e.type}):e},w=function(t,u){t=p(t);var d,w,y,m=this,S=t.type,h=!1,O=function(){v(m,"writestart progress write writeend".split(" "))},E=function(){if((h||!d)&&(d=n().createObjectURL(t)),w)w.location.href=d;else{var o=e.open(d,"_blank");void 0==o&&"undefined"!=typeof safari&&(e.location.href=d)}m.readyState=m.DONE,O(),l(d)},R=function(e){return function(){return m.readyState!==m.DONE?e.apply(this,arguments):void 0}},b={create:!0,exclusive:!1};return m.readyState=m.INIT,u||(u="download"),r?(d=n().createObjectURL(t),o.href=d,o.download=u,i(o),m.readyState=m.DONE,O(),void l(d)):(e.chrome&&S&&S!==f&&(y=t.slice||t.webkitSlice,t=y.call(t,0,t.size,f),h=!0),a&&"download"!==u&&(u+=".download"),(S===f||a)&&(w=e),c?(s+=t.size,void c(e.TEMPORARY,s,R(function(e){e.root.getDirectory("saved",b,R(function(e){var n=function(){e.getFile(u,b,R(function(e){e.createWriter(R(function(n){n.onwriteend=function(t){w.location.href=e.toURL(),m.readyState=m.DONE,v(m,"writeend",t),l(e)},n.onerror=function(){var e=n.error;e.code!==e.ABORT_ERR&&E()},"writestart progress write abort".split(" ").forEach(function(e){n["on"+e]=m["on"+e]}),n.write(t),m.abort=function(){n.abort(),m.readyState=m.DONE},m.readyState=m.WRITING}),E)}),E)};e.getFile(u,{create:!1},R(function(e){e.remove(),n()}),R(function(e){e.code===e.NOT_FOUND_ERR?n():E()}))}),E)}),E)):void E())},y=w.prototype,m=function(e,t){return new w(e,t)};return"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(e,t){return navigator.msSaveOrOpenBlob(p(e),t)}:(y.abort=function(){var e=this;e.readyState=e.DONE,v(e,"abort")},y.readyState=y.INIT=0,y.WRITING=1,y.DONE=2,y.error=y.onwritestart=y.onprogress=y.onwrite=y.onabort=y.onerror=y.onwriteend=null,m)}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this.content);"undefined"!=typeof module&&module.exports?module.exports.saveAs=saveAs:"undefined"!=typeof define&&null!==define&&null!=define.amd&&define([],function(){return saveAs});
/*!
 * @copyright Copyright &copy; Kartik Visweswaran, Krajee.com, 2014 - 2015
 * @version 4.2.3
 *
 * File input styled for Bootstrap 3.0 that utilizes HTML5 File Input's advanced 
 * features including the FileReader API. 
 * 
 * The plugin drastically enhances the HTML file input to preview multiple files on the client before
 * upload. In addition it provides the ability to preview content of images, text, videos, audio, html, 
 * flash and other objects. It also offers the ability to upload and delete files using AJAX, and add 
 * files in batches (i.e. preview, append, or remove before upload).
 * 
 * Author: Kartik Visweswaran
 * Copyright: 2015, Kartik Visweswaran, Krajee.com
 * For more JQuery plugins visit http://plugins.krajee.com
 * For more Yii related demos visit http://demos.krajee.com
 */!function(e){"use strict";e.fn.fileinputLocales={},String.prototype.repl=function(e,i){return this.split(e).join(i)};var i=function(e){var i,t=document.createElement("div");return t.innerHTML="<!--[if IE "+e+"]><i></i><![endif]-->",i=1===t.getElementsByTagName("i").length,document.body.appendChild(t),t.parentNode.removeChild(t),i},t={data:{},init:function(e){var i=e.initialPreview,a=e.id;i.length>0&&!z(i)&&(i=i.split(e.initialPreviewDelimiter)),t.data[a]={content:i,config:e.initialPreviewConfig,tags:e.initialPreviewThumbTags,delimiter:e.initialPreviewDelimiter,template:e.previewGenericTemplate,msg:function(i){return e.getMsgSelected(i)},initId:e.previewInitId,footer:e.getLayoutTemplate("footer"),isDelete:e.initialPreviewShowDelete,caption:e.initialCaption,actions:function(i,t,a,n,r){return e.renderFileActions(i,t,a,n,r)}}},fetch:function(e){return t.data[e].content.filter(function(e){return null!==e})},count:function(e,i){return t.data[e]&&t.data[e].content?i?t.data[e].content.length:t.fetch(e).length:0},get:function(i,a,n){var r,l,o="init_"+a,s=t.data[i],d=s.config[a],c=s.initId+"-"+o,p=" file-preview-initial";return n=void 0===n?!0:n,null===s.content[a]?"":(R(d)||R(d.frameClass)||(p+=" "+d.frameClass),r=s.template.repl("{previewId}",c).repl("{frameClass}",p).repl("{fileindex}",o).repl("{content}",s.content[a]).repl("{footer}",t.footer(i,a,n)),s.tags.length&&s.tags[a]&&(r=H(r,s.tags[a])),R(d)||R(d.frameAttr)||(l=e(document.createElement("div")).html(r),l.find(".file-preview-initial").attr(d.frameAttr),r=l.html(),l.remove()),r)},add:function(i,a,n,r,l){var o,s=e.extend(!0,{},t.data[i]);return z(a)||(a=a.split(s.delimiter)),l?(o=s.content.push(a)-1,s.config[o]=n,s.tags[o]=r):(o=a.length,s.content=a,s.config=n,s.tags=r),t.data[i]=s,o},set:function(i,a,n,r,l){var o,s=e.extend(!0,{},t.data[i]);if(z(a)||(a=a.split(s.delimiter)),l){for(o=0;o<a.length;o++)s.content.push(a[o]);for(o=0;o<n.length;o++)s.config.push(n[o]);for(o=0;o<r.length;o++)s.tags.push(r[o])}else s.content=a,s.config=n,s.tags=r;t.data[i]=s},unset:function(e,i){var a=t.count(e);if(a){if(1===a)return t.data[e].content=[],void(t.data[e].config=[]);t.data[e].content[i]=null,t.data[e].config[i]=null}},out:function(e){var i,a="",n=t.data[e],r=t.count(e,!0);if(0===r)return{content:"",caption:""};for(var l=0;r>l;l++)a+=t.get(e,l);return i=n.msg(t.count(e)),{content:a,caption:i}},footer:function(e,i,a){var n=t.data[e];if(a=void 0===a?!0:a,0===n.config.length||R(n.config[i]))return"";var r=n.config[i],l=M("caption",r)?r.caption:"",o=M("width",r)?r.width:"auto",s=M("url",r)?r.url:!1,d=M("key",r)?r.key:null,c=s===!1&&a,p=n.isDelete?n.actions(!1,!0,c,s,d):"",u=n.footer.repl("{actions}",p);return u.repl("{caption}",l).repl("{width}",o).repl("{indicator}","").repl("{indicatorTitle}","")}},a=function(e,i){return i=i||0,"number"==typeof e?e:("string"==typeof e&&(e=parseFloat(e)),isNaN(e)?i:e)},n=function(){return window.File&&window.FileReader},r=function(){var e=document.createElement("div");return!i(9)&&(void 0!==e.draggable||void 0!==e.ondragstart&&void 0!==e.ondrop)},l=function(){return n()&&window.FormData},o=function(e,i){e.removeClass(i).addClass(i)},s='style="width:{width};height:{height};"',d='      <param name="controller" value="true" />\n      <param name="allowFullScreen" value="true" />\n      <param name="allowScriptAccess" value="always" />\n      <param name="autoPlay" value="false" />\n      <param name="autoStart" value="false" />\n      <param name="quality" value="high" />\n',c='<div class="file-preview-other">\n       {previewFileIcon}\n   </div>',p={removeIcon:'<i class="glyphicon glyphicon-trash text-danger"></i>',removeClass:"btn btn-xs btn-default",removeTitle:"Remove file",uploadIcon:'<i class="glyphicon glyphicon-upload text-info"></i>',uploadClass:"btn btn-xs btn-default",uploadTitle:"Upload file",indicatorNew:'<i class="glyphicon glyphicon-hand-down text-warning"></i>',indicatorSuccess:'<i class="glyphicon glyphicon-ok-sign file-icon-large text-success"></i>',indicatorError:'<i class="glyphicon glyphicon-exclamation-sign text-danger"></i>',indicatorLoading:'<i class="glyphicon glyphicon-hand-up text-muted"></i>',indicatorNewTitle:"Not uploaded yet",indicatorSuccessTitle:"Uploaded",indicatorErrorTitle:"Upload Error",indicatorLoadingTitle:"Uploading ..."},u='{preview}\n<div class="kv-upload-progress hide"></div>\n<div class="input-group {class}">\n   {caption}\n   <div class="input-group-btn">\n       {remove}\n       {cancel}\n       {upload}\n       {browse}\n   </div>\n</div>',f='{preview}\n<div class="kv-upload-progress hide"></div>\n{remove}\n{cancel}\n{upload}\n{browse}\n',v='<div class="file-preview {class}">\n    <div class="close fileinput-remove">&times;</div>\n    <div class="{dropClass}">\n    <div class="file-preview-thumbnails">\n    </div>\n    <div class="clearfix"></div>    <div class="file-preview-status text-center text-success"></div>\n    <div class="kv-fileinput-error"></div>\n    </div>\n</div>',h='<span class="glyphicon glyphicon-file kv-caption-icon"></span>',m='<div tabindex="-1" class="form-control file-caption {class}">\n   <span class="file-caption-ellipsis">&hellip;</span>\n   <div class="file-caption-name"></div>\n</div>',g='<div id="{id}" class="modal fade">\n  <div class="modal-dialog modal-lg">\n    <div class="modal-content">\n      <div class="modal-header">\n        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\n        <h3 class="modal-title">Detailed Preview <small>{title}</small></h3>\n      </div>\n      <div class="modal-body">\n        <textarea class="form-control" style="font-family:Monaco,Consolas,monospace; height: {height}px;" readonly>{body}</textarea>\n      </div>\n    </div>\n  </div>\n</div>',w='<div class="progress">\n    <div class="{class}" role="progressbar" aria-valuenow="{percent}" aria-valuemin="0" aria-valuemax="100" style="width:{percent}%;">\n        {percent}%\n     </div>\n</div>',b='<div class="file-thumbnail-footer">\n    <div class="file-caption-name">{caption}</div>\n    {actions}\n</div>',x='<div class="file-actions">\n    <div class="file-footer-buttons">\n        {upload}{delete}{other}    </div>\n    <div class="file-upload-indicator" tabindex="-1" title="{indicatorTitle}">{indicator}</div>\n    <div class="clearfix"></div>\n</div>',C='<button type="button" class="kv-file-remove {removeClass}" title="{removeTitle}"{dataUrl}{dataKey}>{removeIcon}</button>\n',y='<button type="button" class="kv-file-upload {uploadClass}" title="{uploadTitle}">   {uploadIcon}\n</button>\n',T='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}">\n   {content}\n   {footer}\n</div>\n',E='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}">\n    <object data="{data}" type="{type}" width="{width}" height="{height}">\n       '+c+"\n    </object>\n   {footer}\n</div>",k='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}">\n   <img src="{data}" class="file-preview-image" title="{caption}" alt="{caption}" '+s+">\n   {footer}\n</div>\n",F='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}">\n   <div class="file-preview-text" title="{caption}" '+s+">\n       {data}\n   </div>\n   {footer}\n</div>",$='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}" title="{caption}" '+s+'>\n   <video width="{width}" height="{height}" controls>\n       <source src="{data}" type="{type}">\n       '+c+"\n   </video>\n   {footer}\n</div>\n",I='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}" title="{caption}" '+s+'>\n   <audio controls>\n       <source src="{data}" type="{type}">\n       '+c+"\n   </audio>\n   {footer}\n</div>",D='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}" title="{caption}" '+s+'>\n   <object type="application/x-shockwave-flash" width="{width}" height="{height}" data="{data}">\n'+d+"       "+c+"\n   </object>\n   {footer}\n</div>\n",P='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}" title="{caption}" '+s+'>\n   <object data="{data}" type="{type}" width="{width}" height="{height}">\n       <param name="movie" value="{caption}" />\n'+d+"         "+c+"\n   </object>\n   {footer}\n</div>",S='<div class="file-preview-frame{frameClass}" id="{previewId}" data-fileindex="{fileindex}" title="{caption}" '+s+">\n   "+c+"\n   {footer}\n</div>",U={main1:u,main2:f,preview:v,icon:h,caption:m,modal:g,progress:w,footer:b,actions:x,actionDelete:C,actionUpload:y},j={generic:T,html:E,image:k,text:F,video:$,audio:I,flash:D,object:P,other:S},A=["image","html","text","video","audio","flash","object"],L={image:{width:"auto",height:"160px"},html:{width:"213px",height:"160px"},text:{width:"160px",height:"160px"},video:{width:"213px",height:"160px"},audio:{width:"213px",height:"80px"},flash:{width:"213px",height:"160px"},object:{width:"160px",height:"160px"},other:{width:"160px",height:"160px"}},O={image:function(e,i){return void 0!==e?e.match("image.*"):i.match(/\.(gif|png|jpe?g)$/i)},html:function(e,i){return void 0!==e?"text/html"===e:i.match(/\.(htm|html)$/i)},text:function(e,i){return void 0!==e&&e.match("text.*")||i.match(/\.(txt|md|csv|nfo|php|ini)$/i)},video:function(e,i){return void 0!==e&&e.match(/\.video\/(ogg|mp4|webm)$/i)||i.match(/\.(og?|mp4|webm)$/i)},audio:function(e,i){return void 0!==e&&e.match(/\.audio\/(ogg|mp3|wav)$/i)||i.match(/\.(ogg|mp3|wav)$/i)},flash:function(e,i){return void 0!==e&&"application/x-shockwave-flash"===e||i.match(/\.(swf)$/i)},object:function(){return!0},other:function(){return!0}},R=function(i,t){return null===i||void 0===i||0===i.length||t&&""===e.trim(i)},z=function(e){return Array.isArray(e)||"[object Array]"===Object.prototype.toString.call(e)},M=function(e,i){return"object"==typeof i&&e in i},N=function(i,t,a){return R(i)||R(i[t])?a:e(i[t])},B=function(){return Math.round((new Date).getTime()+100*Math.random())},Z=function(e){return String(e).repl("&","&amp;").repl('"',"&quot;").repl("'","&#39;").repl("<","&lt;").repl(">","&gt;")},H=function(i,t){var a=i;return t=t||{},e.each(t,function(e,i){"function"==typeof i&&(i=i()),a=a.repl(e,i)}),a},W=window.URL||window.webkitURL,_=function(t,a){var r=this;r.$element=e(t),r.validate()&&(r.isPreviewable=n(),r.isIE9=i(9),r.isIE10=i(10),r.isPreviewable||r.isIE9?(r.init(a),r.listen()):r.$element.removeClass("file-loading"))};_.prototype={constructor:_,validate:function(){var e,i=this;return"file"===i.$element.attr("type")?!0:(e='<div class="help-block alert alert-warning"><h4>Invalid Input Type</h4>You must set an input <code>type = file</code> for <b>bootstrap-fileinput</b> plugin to initialize.</div>',i.$element.after(e),!1)},init:function(i){var n,s=this,d=s.$element;e.each(i,function(e,i){s[e]="maxFileCount"===e||"maxFileSize"===e?a(i):i}),s.fileInputCleared=!1,s.fileBatchCompleted=!0,R(s.allowedPreviewTypes)&&(s.allowedPreviewTypes=A),s.isPreviewable||(s.showPreview=!1),s.uploadFileAttr=R(d.attr("name"))?"file_data":d.attr("name"),s.reader=null,s.formdata={},s.filestack=[],s.ajaxRequests=[],s.isError=!1,s.ajaxAborted=!1,s.dropZoneEnabled=r()&&s.dropZoneEnabled,s.isDisabled=s.$element.attr("disabled")||s.$element.attr("readonly"),s.isUploadable=l()&&!R(s.uploadUrl),s.slug="function"==typeof i.slugCallback?i.slugCallback:s.slugDefault,s.mainTemplate=s.getLayoutTemplate(s.showCaption?"main1":"main2"),s.captionTemplate=s.getLayoutTemplate("caption"),s.previewGenericTemplate=s.getPreviewTemplate("generic"),R(s.$element.attr("id"))&&s.$element.attr("id",B()),void 0===s.$container?s.$container=s.createContainer():s.refreshContainer(),s.$progress=s.$container.find(".kv-upload-progress"),s.$btnUpload=s.$container.find(".kv-fileinput-upload"),s.$captionContainer=N(i,"elCaptionContainer",s.$container.find(".file-caption")),s.$caption=N(i,"elCaptionText",s.$container.find(".file-caption-name")),s.$previewContainer=N(i,"elPreviewContainer",s.$container.find(".file-preview")),s.$preview=N(i,"elPreviewImage",s.$container.find(".file-preview-thumbnails")),s.$previewStatus=N(i,"elPreviewStatus",s.$container.find(".file-preview-status")),s.$errorContainer=N(i,"elErrorContainer",s.$previewContainer.find(".kv-fileinput-error")),R(s.msgErrorClass)||o(s.$errorContainer,s.msgErrorClass),s.$errorContainer.hide(),s.fileActionSettings=e.extend(p,i.fileActionSettings),s.previewInitId="preview-"+B(),s.id=s.$element.attr("id"),t.init(s),s.initPreview(!0),s.initPreviewDeletes(),s.options=i,s.setFileDropZoneTitle(),s.uploadCount=0,s.uploadPercent=0,s.$element.removeClass("file-loading"),n=s.getLayoutTemplate("progress"),s.progressTemplate=n.replace("{class}",s.progressClass),s.progressCompleteTemplate=n.replace("{class}",s.progressCompleteClass),s.setEllipsis()},parseError:function(i,t,a){var n=this,r=e.trim(t+""),l="."===r.slice(-1)?"":".",o=void 0!==i.responseJSON&&void 0!==i.responseJSON.error?i.responseJSON.error:i.responseText;return n.showAjaxErrorDetails?(o=e.trim(o.replace(/\n\s*\n/g,"\n")),o=o.length>0?"<pre>"+o+"</pre>":"",r+=l+o):r+=l,a?"<b>"+a+": </b>"+i:r},raise:function(i,t){var a=this,n=e.Event(i);if(void 0!==t?a.$element.trigger(n,t):a.$element.trigger(n),!n.result)return n.result;switch(i){case"filebatchuploadcomplete":case"filebatchuploadsuccess":case"fileuploaded":case"fileclear":case"filecleared":case"filereset":case"fileerror":case"filefoldererror":case"fileuploaderror":case"filebatchuploaderror":case"filedeleteerror":case"filecustomerror":case"filesuccessremove":break;default:a.ajaxAborted=n.result}return!0},getLayoutTemplate:function(e){var i=this,t=M(e,i.layoutTemplates)?i.layoutTemplates[e]:U[e];return R(i.customLayoutTags)?t:H(t,i.customLayoutTags)},getPreviewTemplate:function(e){var i=this,t=M(e,i.previewTemplates)?i.previewTemplates[e]:j[e];return t=t.repl("{previewFileIcon}",i.previewFileIcon),R(i.customPreviewTags)?t:H(t,i.customPreviewTags)},getOutData:function(e,i,t){var a=this;return e=e||{},i=i||{},t=t||a.filestack.slice(0)||{},{form:a.formdata,files:t,extra:a.getExtraData(),response:i,reader:a.reader,jqXHR:e}},setEllipsis:function(){var e=this,i=e.$captionContainer,t=e.$caption,a=t.clone().css("height","auto").hide();i.parent().before(a),i.removeClass("kv-has-ellipsis"),a.outerWidth()>t.outerWidth()&&i.addClass("kv-has-ellipsis"),a.remove()},listen:function(){var i=this,t=i.$element,a=i.$captionContainer,n=i.$btnFile,r=t.closest("form");t.on("change",e.proxy(i.change,i)),e(window).on("resize",function(){i.setEllipsis()}),n.off("click").on("click",function(){i.raise("filebrowse"),i.isError&&!i.isUploadable&&i.clear(),a.focus()}),r.off("reset").on("reset",e.proxy(i.reset,i)),i.$container.off("click").on("click",".fileinput-remove:not([disabled])",e.proxy(i.clear,i)).on("click",".fileinput-cancel",e.proxy(i.cancel,i)),i.isUploadable&&i.dropZoneEnabled&&i.showPreview&&i.initDragDrop(),i.isUploadable||r.on("submit",e.proxy(i.submitForm,i)),i.$container.find(".kv-fileinput-upload").off("click").on("click",function(t){var a,n=e(this),r=!n.hasClass("disabled")&&R(n.attr("disabled"));return i.isUploadable?(t.preventDefault(),void(r&&i.upload())):void(r&&"submit"!==n.attr("type")&&(a=n.closest("form"),a.length&&a.trigger("submit"),t.preventDefault()))})},submitForm:function(){var e=this,i=e.$element,t=i.get(0).files;return t&&t.length<e.minFileCount&&e.minFileCount>0?(e.noFilesError({}),!1):!e.abort({})},abort:function(i){var t,a=this;return a.ajaxAborted&&"object"==typeof a.ajaxAborted&&void 0!==a.ajaxAborted.message?(t=e.extend(a.getOutData(),i),t.abortData=a.ajaxAborted.data||{},t.abortMessage=a.ajaxAborted.message,a.showUploadError(a.ajaxAborted.message,t,"filecustomerror"),!0):!1},noFilesError:function(e){var i=this,t=i.minFileCount>1?i.filePlural:i.fileSingle,a=i.msgFilesTooLess.replace("{n}",i.minFileCount).replace("{files}",t),n=i.$errorContainer;n.html(a),i.isError=!0,i.updateFileDetails(0),n.fadeIn(800),i.raise("fileerror",[e]),i.clearFileInput(),o(i.$container,"has-error")},setProgress:function(e){var i=this,t=Math.min(e,100),a=100>t?i.progressTemplate:i.progressCompleteTemplate;R(a)||i.$progress.html(a.repl("{percent}",t))},upload:function(){var i,t,a,n=this,r=n.getFileStack().length,l={},o=!e.isEmptyObject(n.getExtraData());if(r<n.minFileCount&&n.minFileCount>0)return void n.noFilesError(l);if(n.isUploadable&&!n.isDisabled&&(0!==r||o)){if(n.resetUpload(),n.$progress.removeClass("hide"),n.uploadCount=0,n.uploadPercent=0,n.lock(),n.setProgress(0),0===r&&o)return void n.uploadExtraOnly();if(a=n.filestack.length,n.hasInitData=!1,n.uploadAsync&&n.showPreview)for(t=n.getOutData(),n.raise("filebatchpreupload",[t]),n.fileBatchCompleted=!1,n.uploadCache={content:[],config:[],tags:[],append:!0},i=0;a>i;i+=1)void 0!==n.filestack[i]&&n.uploadSingle(i,n.filestack,!0);else n.uploadBatch()}},lock:function(){var e=this;e.resetErrors(),e.disable(),e.showRemove&&o(e.$container.find(".fileinput-remove"),"hide"),e.showCancel&&e.$container.find(".fileinput-cancel").removeClass("hide"),e.raise("filelock",[e.filestack,e.getExtraData()])},unlock:function(e){var i=this;void 0===e&&(e=!0),i.enable(),i.showCancel&&o(i.$container.find(".fileinput-cancel"),"hide"),i.showRemove&&i.$container.find(".fileinput-remove").removeClass("hide"),e&&i.resetFileStack(),i.raise("fileunlock",[i.filestack,i.getExtraData()])},resetFileStack:function(){var i=this,t=0,a=[];i.getThumbs().each(function(){var n=e(this),r=n.attr("data-fileindex"),l=i.filestack[r];-1!==r&&(void 0!==l?(a[t]=l,n.attr({id:i.previewInitId+"-"+t,"data-fileindex":t}),t+=1):n.attr({id:"uploaded-"+B(),"data-fileindex":"-1"}))}),i.filestack=a},refresh:function(i){var t,a=this,n=a.$element,r=arguments.length?e.extend(a.options,i):a.options;n.off(),a.init(r),t=a.$container.find(".file-drop-zone"),t.off("dragenter dragover dragleave drop"),e(document).off("dragenter dragover drop"),a.listen(),a.setFileDropZoneTitle()},initDragDrop:function(){var i=this,t=i.$container.find(".file-drop-zone");t.off("dragenter dragover dragleave drop"),e(document).off("dragenter dragover drop"),t.on("dragenter dragover",function(t){var a=e.inArray("Files",t.originalEvent.dataTransfer.types)>-1;return t.stopPropagation(),t.preventDefault(),i.isDisabled||!a?(t.originalEvent.dataTransfer.effectAllowed="none",void(t.originalEvent.dataTransfer.dropEffect="none")):void o(e(this),"highlighted")}),t.on("dragleave",function(t){t.stopPropagation(),t.preventDefault(),i.isDisabled||e(this).removeClass("highlighted")}),t.on("drop",function(t){t.preventDefault(),i.isDisabled||R(t.originalEvent.dataTransfer.files)||(i.change(t,"dragdrop"),e(this).removeClass("highlighted"))}),e(document).on("dragenter dragover drop",function(e){e.stopPropagation(),e.preventDefault()})},setFileDropZoneTitle:function(){var e=this,i=e.$container.find(".file-drop-zone");i.find("."+e.dropZoneTitleClass).remove(),e.isUploadable&&e.showPreview&&0!==i.length&&!(e.getFileStack().length>0)&&e.dropZoneEnabled&&(0===i.find(".file-preview-frame").length&&i.prepend('<div class="'+e.dropZoneTitleClass+'">'+e.dropZoneTitle+"</div>"),e.$container.removeClass("file-input-new"),o(e.$container,"file-input-ajax-new"))},initFileActions:function(){var i=this;i.$preview.find(".kv-file-remove").each(function(){var a,n,r=e(this),l=r.closest(".file-preview-frame"),o=l.attr("data-fileindex");r.off("click").on("click",function(){i.cleanMemory(l),l.fadeOut("slow",function(){i.filestack[o]=void 0,i.clearObjects(l),l.remove();var e=i.getFileStack(!0),r=e.length,s=t.count(i.id);i.clearFileInput(),0===r&&0===s?i.reset():(a=s+r,n=a>1?i.getMsgSelected(a):e[0]?e[0].name:"",i.setCaption(n))})})}),i.$preview.find(".kv-file-upload").each(function(){var t=e(this);t.off("click").on("click",function(){var e=t.closest(".file-preview-frame"),a=e.attr("data-fileindex");i.uploadSingle(a,i.filestack,!1)})})},getMsgSelected:function(e){var i=this,t=1===e?i.fileSingle:i.filePlural;return i.msgSelected.replace("{n}",e).replace("{files}",t)},renderFileFooter:function(e,i){var t,a,n=this,r=n.fileActionSettings,l=n.getLayoutTemplate("footer");return n.isUploadable?(t=l.repl("{actions}",n.renderFileActions(!0,!0,!1,!1,!1)),a=t.repl("{caption}",e).repl("{width}",i).repl("{indicator}",r.indicatorNew).repl("{indicatorTitle}",r.indicatorNewTitle)):a=l.repl("{actions}","").repl("{caption}",e).repl("{width}",i).repl("{indicator}","").repl("{indicatorTitle}",""),a=H(a,n.previewThumbTags)},renderFileActions:function(e,i,t,a,n){if(!e&&!i)return"";var r=this,l=a===!1?"":' data-url="'+a+'"',o=n===!1?"":' data-key="'+n+'"',s=r.getLayoutTemplate("actionDelete"),d="",c=r.getLayoutTemplate("actions"),p=r.otherActionButtons.repl("{dataKey}",o),u=r.fileActionSettings,f=t?u.removeClass+" disabled":u.removeClass;return s=s.repl("{removeClass}",f).repl("{removeIcon}",u.removeIcon).repl("{removeTitle}",u.removeTitle).repl("{dataUrl}",l).repl("{dataKey}",o),e&&(d=r.getLayoutTemplate("actionUpload").repl("{uploadClass}",u.uploadClass).repl("{uploadIcon}",u.uploadIcon).repl("{uploadTitle}",u.uploadTitle)),c.repl("{delete}",s).repl("{upload}",d).repl("{other}",p)},setThumbStatus:function(e,i){var t=this,a="indicator"+i,n=a+"Title",r="file-preview-"+i.toLowerCase(),l=e.find(".file-upload-indicator"),o=t.fileActionSettings;e.removeClass("file-preview-success file-preview-error file-preview-loading"),l.html(o[a]),l.attr("title",o[n]),e.addClass(r)},clearPreview:function(){var e=this,i=e.$preview.find(e.showUploadedThumbs?".file-preview-frame:not(.file-preview-success)":".file-preview-frame");i.remove(),e.$preview.find(".file-preview-frame").length&&e.showPreview||e.resetUpload()},initPreview:function(e){var i,a=this,n=a.initialCaption||"";return t.count(a.id)?(i=t.out(a.id),n=e&&a.initialCaption?a.initialCaption:i.caption,a.$preview.html(i.content),a.setCaption(n),void(R(i.content)||a.$container.removeClass("file-input-new"))):(a.clearPreview(),void(e?a.setCaption(n):a.initCaption()))},initPreviewDeletes:function(){var i=this,a=i.deleteExtraData||{},n=function(){0===i.$preview.find(".kv-file-remove").length&&(i.reset(),i.initialCaption="")};i.$preview.find(".kv-file-remove").each(function(){var r=e(this),l=r.data("url")||i.deleteUrl,s=r.data("key");if(!R(l)&&void 0!==s){var d,c,p,u,f=r.closest(".file-preview-frame"),v=t.data[i.id],h=f.data("fileindex");h=parseInt(h.replace("init_","")),p=R(v.config)&&R(v.config[h])?null:v.config[h],u=R(p)||R(p.extra)?a:p.extra,"function"==typeof u&&(u=u()),c={id:r.attr("id"),key:s,extra:u},d=e.extend({url:l,type:"DELETE",dataType:"json",data:e.extend({key:s},u),beforeSend:function(e){i.ajaxAborted=!1,i.raise("filepredelete",[s,e,u]),i.ajaxAborted?e.abort():(o(f,"file-uploading"),o(r,"disabled"))},success:function(e,a,l){var o,d;return R(e)||R(e.error)?(t.unset(i.id,h),o=t.count(i.id),d=o>0?i.getMsgSelected(o):"",i.raise("filedeleted",[s,l,u]),i.setCaption(d),f.removeClass("file-uploading").addClass("file-deleted"),void f.fadeOut("slow",function(){i.clearObjects(f),f.remove(),n(),o||0!==i.getFileStack().length||(i.setCaption(""),i.reset())})):(c.jqXHR=l,c.response=e,i.showError(e.error,c,"filedeleteerror"),f.removeClass("file-uploading"),r.removeClass("disabled"),void n())},error:function(e,t,a){var r=i.parseError(e,a);c.jqXHR=e,c.response={},i.showError(r,c,"filedeleteerror"),f.removeClass("file-uploading"),n()}},i.ajaxDeleteSettings),r.off("click").on("click",function(){e.ajax(d)})}})},clearObjects:function(i){i.find("video audio").each(function(){this.pause(),e(this).remove()}),i.find("img object div").each(function(){e(this).remove()})},clearFileInput:function(){var i,t,a,n=this,r=n.$element;R(r.val())||(n.isIE9||n.isIE10?(i=r.closest("form"),t=e(document.createElement("form")),a=e(document.createElement("div")),r.before(a),i.length?i.after(t):a.after(t),t.append(r).trigger("reset"),a.before(r).remove(),t.remove()):r.val(""),n.fileInputCleared=!0)},resetUpload:function(){var e=this;e.uploadCache={content:[],config:[],tags:[],append:!0},e.uploadCount=0,e.uploadPercent=0,e.$btnUpload.removeAttr("disabled"),e.setProgress(0),o(e.$progress,"hide"),e.resetErrors(!1),e.ajaxAborted=!1,e.ajaxRequests=[]},cancel:function(){var i,t=this,a=t.ajaxRequests,n=a.length;if(n>0)for(i=0;n>i;i+=1)a[i].abort();t.getThumbs().each(function(){var i=e(this),a=i.attr("data-fileindex");i.removeClass("file-uploading"),void 0!==t.filestack[a]&&(i.find(".kv-file-upload").removeClass("disabled").removeAttr("disabled"),i.find(".kv-file-remove").removeClass("disabled").removeAttr("disabled")),t.unlock()})},cleanMemory:function(e){var i=e.is("img")?e.attr("src"):e.find("source").attr("src");W.revokeObjectURL(i)},hasInitialPreview:function(){var e=this;return!e.overwriteInitial&&t.count(e.id)},clear:function(){var i,t=this;t.$btnUpload.removeAttr("disabled"),t.getThumbs().find("video,audio,img").each(function(){t.cleanMemory(e(this))}),t.resetUpload(),t.filestack=[],t.clearFileInput(),t.resetErrors(!0),t.raise("fileclear"),t.hasInitialPreview()?(t.showFileIcon(),t.resetPreview(),t.setEllipsis(),t.initPreviewDeletes(),t.$container.removeClass("file-input-new")):(t.getThumbs().each(function(){t.clearObjects(e(this))}),t.$preview.html(""),i=!t.overwriteInitial&&t.initialCaption.length>0?t.initialCaption:"",t.setCaption(i),t.setEllipsis(),t.$caption.attr("title",""),o(t.$container,"file-input-new")),0===t.$container.find(".file-preview-frame").length&&(t.initCaption()||t.$captionContainer.find(".kv-caption-icon").hide(),t.setEllipsis()),t.hideFileIcon(),t.raise("filecleared"),t.$captionContainer.focus(),t.setFileDropZoneTitle()},resetPreview:function(){var e,i=this;t.count(i.id)?(e=t.out(i.id),i.$preview.html(e.content),i.setCaption(e.caption)):(i.clearPreview(),i.initCaption())},reset:function(){var e=this;e.resetPreview(),e.setEllipsis(),e.$container.find(".fileinput-filename").text(""),e.raise("filereset"),e.initialPreview.length>0&&e.$container.removeClass("file-input-new"),e.setFileDropZoneTitle(),e.filestack=[],e.formdata={}},disable:function(){var e=this;e.isDisabled=!0,e.raise("filedisabled"),e.$element.attr("disabled","disabled"),e.$container.find(".kv-fileinput-caption").addClass("file-caption-disabled"),e.$container.find(".btn-file, .fileinput-remove, .kv-fileinput-upload").attr("disabled",!0),e.initDragDrop()},enable:function(){var e=this;e.isDisabled=!1,e.raise("fileenabled"),e.$element.removeAttr("disabled"),e.$container.find(".kv-fileinput-caption").removeClass("file-caption-disabled"),e.$container.find(".btn-file, .fileinput-remove, .kv-fileinput-upload").removeAttr("disabled"),e.initDragDrop()},getThumbs:function(e){return e=e||"",this.$preview.find(".file-preview-frame:not(.file-preview-initial)"+e)},getExtraData:function(){var e=this,i=e.uploadExtraData;return"function"==typeof e.uploadExtraData&&(i=e.uploadExtraData()),i},uploadExtra:function(){var i=this,t=i.getExtraData();0!==t.length&&e.each(t,function(e,t){i.formdata.append(e,t)})},initXhr:function(e,i){var t=this;return e.upload&&e.upload.addEventListener("progress",function(e){var a=0,n=e.loaded||e.position,r=e.total;e.lengthComputable&&(a=Math.ceil(n/r*i)),t.uploadPercent=Math.max(a,t.uploadPercent),t.setProgress(t.uploadPercent)},!1),e},ajaxSubmit:function(i,t,a,n){var r,l=this;l.uploadExtra(),r=e.extend({xhr:function(){var i=e.ajaxSettings.xhr();return l.initXhr(i,98)},url:l.uploadUrl,type:"POST",dataType:"json",data:l.formdata,cache:!1,processData:!1,contentType:!1,beforeSend:i,success:t,complete:a,error:n},l.ajaxSettings),l.ajaxRequests.push(e.ajax(r))},initUploadSuccess:function(i,a,n){var r,l,o,s,d,c,p,u=this;"object"!=typeof i||e.isEmptyObject(i)||void 0!==i.initialPreview&&i.initialPreview.length>0&&(u.hasInitData=!0,d=i.initialPreview||[],c=i.initialPreviewConfig||[],p=i.initialPreviewThumbTags||[],r=void 0===i.append||i.append?!0:!1,u.overwriteInitial=!1,void 0===a||n?n?(u.uploadCache.content.push(d[0]),u.uploadCache.config.push(c[0]),u.uploadCache.tags.push(p[0]),u.uploadCache.append=r):(t.set(u.id,d,c,p,r),u.initPreview(),u.initPreviewDeletes()):(o=t.add(u.id,d,c[0],p[0],r),l=t.get(u.id,o,!1),s=e(l).hide(),a.after(s).fadeOut("slow",function(){s.fadeIn("slow").css("display:inline-block"),u.initPreviewDeletes(),u.clearFileInput(),a.remove()})))},initSuccessThumbs:function(){var i=this;i.getThumbs(".file-preview-success").each(function(){var t=e(this),a=t.find(".kv-file-remove");a.removeAttr("disabled").off("click").on("click",function(){var e=i.raise("filesuccessremove",[t.attr("id"),t.data("fileindex")]);i.cleanMemory(t),e!==!1&&t.fadeOut("slow",function(){t.remove(),i.$preview.find(".file-preview-frame").length||i.reset()})})})},uploadSingle:function(i,a,n){var r,l,s,d,c,p,u,f,v,h=this,m=h.getFileStack().length,g=new FormData,w=h.previewInitId+"-"+i,b=e("#"+w+":not(.file-preview-initial)"),x=b.find(".kv-file-upload"),C=b.find(".kv-file-remove"),y=h.filestack.length>0||!e.isEmptyObject(h.uploadExtraData),T={id:w,index:i};h.formdata=g,0===m||!y||x.hasClass("disabled")||h.abort(T)||(s=function(){var e=h.getThumbs(".file-uploading");e.length>0||h.fileBatchCompleted||(h.fileBatchCompleted=!0,setTimeout(function(){t.set(h.id,h.uploadCache.content,h.uploadCache.config,h.uploadCache.tags,h.uploadCache.append),h.hasInitData&&(h.initPreview(),h.initPreviewDeletes()),h.setProgress(100),h.unlock(),h.clearFileInput(),h.raise("filebatchuploadcomplete",[h.filestack,h.getExtraData()])},100))},d=function(){!n||0===m||h.uploadPercent>=100||(h.uploadCount+=1,l=80+Math.ceil(20*h.uploadCount/m),h.uploadPercent=Math.max(l,h.uploadPercent),h.setProgress(h.uploadPercent),h.initPreviewDeletes())},c=function(){x.removeAttr("disabled"),C.removeAttr("disabled"),b.removeClass("file-uploading")},p=function(t){r=h.getOutData(t),b.hasClass("file-preview-success")||(h.setThumbStatus(b,"Loading"),o(b,"file-uploading")),x.attr("disabled",!0),C.attr("disabled",!0),n||h.lock(),h.raise("filepreupload",[r,w,i]),T=e.extend(T,r),h.abort(T)&&(t.abort(),h.setProgress(100))},u=function(t,a,l){r=h.getOutData(l,t),T=e.extend(T,r),setTimeout(function(){R(t)||R(t.error)?(h.setThumbStatus(b,"Success"),x.hide(),h.filestack[i]=void 0,h.raise("fileuploaded",[r,w,i]),h.initUploadSuccess(t,b,n),n||h.resetFileStack()):(h.setThumbStatus(b,"Error"),h.showUploadError(t.error,T))},100)},f=function(){setTimeout(function(){d(),c(),n?s():h.unlock(!1),h.initSuccessThumbs()},100)},v=function(t,r,l){var o=h.parseError(t,l,n?a[i].name:null);h.setThumbStatus(b,"Error"),T=e.extend(T,h.getOutData(t)),h.showUploadError(o,T)},g.append(h.uploadFileAttr,a[i]),g.append("file_id",i),h.ajaxSubmit(p,u,f,v))},uploadBatch:function(){var i,t,a,n,r,l=this,s=l.filestack,d=s.length,c=l.filestack.length>0||!e.isEmptyObject(l.uploadExtraData),p={};l.formdata=new FormData,0!==d&&c&&!l.abort(p)&&(i=function(){e.each(s,function(e){l.filestack[e]=void 0}),l.clearFileInput()},t=function(i){l.lock();var t=l.getOutData(i);l.showPreview&&l.getThumbs().each(function(){var i=e(this),t=i.find(".kv-file-upload"),a=i.find(".kv-file-remove");i.hasClass("file-preview-success")||(l.setThumbStatus(i,"Loading"),o(i,"file-uploading")),t.attr("disabled",!0),a.attr("disabled",!0)}),l.raise("filebatchpreupload",[t]),l.abort(t)&&i.abort()},a=function(t,a,n){var r=l.getOutData(n,t),o=l.getThumbs(),s=R(t.errorkeys)?[]:t.errorkeys;R(t)||R(t.error)?(l.raise("filebatchuploadsuccess",[r]),i(),l.showPreview?(o.each(function(){var i=e(this),t=i.find(".kv-file-upload");i.find(".kv-file-upload").hide(),l.setThumbStatus(i,"Success"),i.removeClass("file-uploading"),t.removeAttr("disabled")}),l.initUploadSuccess(t)):l.reset()):(l.showPreview&&(o.each(function(){var i=e(this),t=i.find(".kv-file-remove"),a=i.find(".kv-file-upload");return i.removeClass("file-uploading"),a.removeAttr("disabled"),t.removeAttr("disabled"),0===s.length?void l.setThumbStatus(i,"Error"):void(-1!==e.inArray(key,s)?l.setThumbStatus(i,"Error"):(i.find(".kv-file-upload").hide(),l.setThumbStatus(i,"Success"),l.filestack[key]=void 0));

}),l.initUploadSuccess(t)),l.showUploadError(t.error,r,"filebatchuploaderror"))},n=function(){l.setProgress(100),l.unlock(),l.initSuccessThumbs(),l.raise("filebatchuploadcomplete",[l.filestack,l.getExtraData()]),l.clearFileInput()},r=function(i,t,a){var n=l.getOutData(i),r=l.parseError(i,a);l.showUploadError(r,n,"filebatchuploaderror"),l.uploadFileCount=d-1,l.showPreview&&(l.getThumbs().each(function(){var i=e(this),t=i.attr("data-fileindex");i.removeClass("file-uploading"),void 0!==l.filestack[t]&&l.setThumbStatus(i,"Error")}),l.getThumbs().removeClass("file-uploading"),l.getThumbs(" .kv-file-upload").removeAttr("disabled"),l.getThumbs(" .kv-file-delete").removeAttr("disabled"))},e.each(s,function(e,i){R(s[e])||l.formdata.append(l.uploadFileAttr,i)}),l.ajaxSubmit(t,a,n,r))},uploadExtraOnly:function(){var e,i,t,a,n=this,r={};n.formdata=new FormData,n.abort(r)||(e=function(e){n.lock();var i=n.getOutData(e);n.raise("filebatchpreupload",[i]),n.setProgress(50),r.data=i,r.xhr=e,n.abort(r)&&(e.abort(),n.setProgress(100))},i=function(e,i,t){var a=n.getOutData(t,e);R(e)||R(e.error)?(n.raise("filebatchuploadsuccess",[a]),n.clearFileInput(),n.initUploadSuccess(e)):n.showUploadError(e.error,a,"filebatchuploaderror")},t=function(){n.setProgress(100),n.unlock(),n.raise("filebatchuploadcomplete",[n.filestack,n.getExtraData()]),n.clearFileInput()},a=function(e,i,t){var a=n.getOutData(e),l=n.parseError(e,t);r.data=a,n.showUploadError(l,a,"filebatchuploaderror")},n.ajaxSubmit(e,i,t,a))},hideFileIcon:function(){this.overwriteInitial&&this.$captionContainer.find(".kv-caption-icon").hide()},showFileIcon:function(){this.$captionContainer.find(".kv-caption-icon").show()},resetErrors:function(e){var i=this,t=i.$errorContainer;i.isError=!1,i.$container.removeClass("has-error"),t.html(""),e?t.fadeOut("slow"):t.hide()},showFolderError:function(e){var i=this,t=i.$errorContainer;e&&(t.html(i.msgFoldersNotAllowed.repl("{n}",e)),t.fadeIn(800),o(i.$container,"has-error"),i.raise("filefoldererror",[e]))},showUploadError:function(e,i,t){var a=this,n=a.$errorContainer,r=t||"fileuploaderror";return 0===n.find("ul").length?n.html("<ul><li>"+e+"</li></ul>"):n.find("ul").append("<li>"+e+"</li>"),n.fadeIn(800),a.raise(r,[i]),o(a.$container,"has-error"),!0},showError:function(e,i,t){var a=this,n=a.$errorContainer,r=t||"fileerror";return i=i||{},i.reader=a.reader,n.html(e),n.fadeIn(800),a.raise(r,[i]),a.isUploadable||a.clearFileInput(),o(a.$container,"has-error"),a.$btnUpload.attr("disabled",!0),!0},errorHandler:function(e,i){var t=this,a=e.target.error;switch(a.code){case a.NOT_FOUND_ERR:t.showError(t.msgFileNotFound.replace("{name}",i));break;case a.SECURITY_ERR:t.showError(t.msgFileSecured.replace("{name}",i));break;case a.NOT_READABLE_ERR:t.showError(t.msgFileNotReadable.replace("{name}",i));break;case a.ABORT_ERR:t.showError(t.msgFilePreviewAborted.replace("{name}",i));break;default:t.showError(t.msgFilePreviewError.replace("{name}",i))}},parseFileType:function(e){var i,t,a,n,r=this;for(n=0;n<A.length;n+=1)if(a=A[n],i=M(a,r.fileTypeSettings)?r.fileTypeSettings[a]:O[a],t=i(e.type,e.name)?a:"",!R(t))return t;return"other"},previewDefault:function(i,t,a){if(this.showPreview){var n=this,r=W.createObjectURL(i),l=(e("#"+t),n.previewSettings.other||L.other),o=n.renderFileFooter(i.name,l.width),s=n.getPreviewTemplate("other"),d=t.slice(t.lastIndexOf("-")+1),c="";a===!0&&(c=" btn disabled",o+='<div class="file-other-error text-danger"><i class="glyphicon glyphicon-exclamation-sign"></i></div>'),n.$preview.append("\n"+s.repl("{previewId}",t).repl("{frameClass}",c).repl("{fileindex}",d).repl("{caption}",n.slug(i.name)).repl("{width}",l.width).repl("{height}",l.height).repl("{type}",i.type).repl("{data}",r).repl("{footer}",o))}},previewFile:function(e,i,t,a,n){if(this.showPreview){var r,l,o,s,d=this,c=d.parseFileType(i),p=d.slug(i.name),u=d.allowedPreviewTypes,f=d.allowedPreviewMimeTypes,v=d.getPreviewTemplate(c),h=M(c,d.previewSettings)?d.previewSettings[c]:L[c],m=parseInt(d.wrapTextLength,10),g=d.wrapIndicator,w=u.indexOf(c)>=0,b=R(f)||!R(f)&&-1!==f.indexOf(i.type),x=d.renderFileFooter(p,h.width),C="",y=a.slice(a.lastIndexOf("-")+1);w&&b?("text"===c?(l=Z(t.target.result),l.length>m&&(o="text-"+B(),s=.75*window.innerHeight,C=d.getLayoutTemplate("modal").repl("{id}",o).repl("{title}",p).repl("{height}",s).repl("{body}",l),g=g.repl("{title}",p).repl("{dialog}","$('#"+o+"').modal('show')"),l=l.substring(0,m-1)+g),r=v.repl("{previewId}",a).repl("{caption}",p).repl("{frameClass}","").repl("{type}",i.type).repl("{width}",h.width).repl("{height}",h.height).repl("{data}",l).repl("{footer}",x).repl("{fileindex}",y)+C):r=v.repl("{previewId}",a).repl("{caption}",p).repl("{frameClass}","").repl("{type}",i.type).repl("{data}",n).repl("{width}",h.width).repl("{height}",h.height).repl("{footer}",x).repl("{fileindex}",y),d.$preview.append("\n"+r),d.validateImage(e,a)):d.previewDefault(i,a)}},slugDefault:function(e){return R(e)?"":e.split(/(\\|\/)/g).pop().replace(/[^\w\u00C0-\u017F\-.\\\/ ]+/g,"")},getFileStack:function(e){var i=this;return i.filestack.filter(function(i){return e?void 0!==i:void 0!==i&&null!==i})},readFiles:function(i){function t(e){if(R(n.attr("multiple"))&&(u=1),e>=u)return a.isUploadable&&a.filestack.length>0?a.raise("filebatchselected",[a.getFileStack()]):a.raise("filebatchselected",[i]),o.removeClass("loading"),void s.html("");var m,g,w,b,x,C,y=v+e,T=p+"-"+y,E=i[e],k=a.slug(E.name),F=(E.size||0)/1e3,$="",I=W.createObjectURL(E),D=0,P=a.allowedFileTypes,S=R(P)?"":P.join(", "),U=a.allowedFileExtensions,j=R(U)?"":U.join(", ");if(R(U)||($=new RegExp("\\.("+U.join("|")+")$","i")),F=F.toFixed(2),a.maxFileSize>0&&F>a.maxFileSize)return b=a.msgSizeTooLarge.replace("{name}",k).replace("{size}",F).replace("{maxSize}",a.maxFileSize),void(a.isError=h(b,E,T,e));if(!R(P)&&z(P)){for(w=0;w<P.length;w+=1)x=P[w],g=f[x],C=void 0!==g&&g(E.type,k),D+=R(C)?0:C.length;if(0===D)return b=a.msgInvalidFileType.replace("{name}",k).replace("{types}",S),void(a.isError=h(b,E,T,e))}return 0!==D||R(U)||!z(U)||R($)||(C=k.match($),D+=R(C)?0:C.length,0!==D)?a.showPreview?(r.length>0&&void 0!==FileReader?(s.html(d.replace("{index}",e+1).replace("{files}",u)),o.addClass("loading"),l.onerror=function(e){a.errorHandler(e,k)},l.onload=function(i){a.previewFile(e,E,i,T,I),a.initFileActions()},l.onloadend=function(){b=c.replace("{index}",e+1).replace("{files}",u).replace("{percent}",50).replace("{name}",k),setTimeout(function(){s.html(b),t(e+1),a.updateFileDetails(u)},100),a.raise("fileloaded",[E,T,e,l])},l.onprogress=function(i){if(i.lengthComputable){var t=i.loaded/i.total*100,a=Math.ceil(t);b=c.replace("{index}",e+1).replace("{files}",u).replace("{percent}",a).replace("{name}",k),setTimeout(function(){s.html(b)},100)}},m=M("text",f)?f.text:O.text,m(E.type,k)?l.readAsText(E,a.textEncoding):l.readAsArrayBuffer(E)):(a.previewDefault(E,T),setTimeout(function(){t(e+1),a.updateFileDetails(u)},100),a.raise("fileloaded",[E,T,e,l])),void a.filestack.push(E)):(a.filestack.push(E),setTimeout(t(e+1),100),void a.raise("fileloaded",[E,T,e,l])):(b=a.msgInvalidFileExtension.replace("{name}",k).replace("{extensions}",j),void(a.isError=h(b,E,T,e)))}this.reader=new FileReader;var a=this,n=a.$element,r=a.$preview,l=a.reader,o=a.$previewContainer,s=a.$previewStatus,d=a.msgLoading,c=a.msgProgress,p=a.previewInitId,u=i.length,f=a.fileTypeSettings,v=a.filestack.length,h=function(t,n,r,l){var o=e.extend(a.getOutData({},{},i),{id:r,index:l}),s={id:r,index:l,file:n,files:i};return a.previewDefault(n,r,!0),a.isUploadable?a.showUploadError(t,o):a.showError(t,s)};t(0),a.updateFileDetails(u,!1)},updateFileDetails:function(e){var i=this,a=i.$element,n=i.getFileStack(),r=a.val()||n.length&&n[0].name||"",l=i.slug(r),o=i.isUploadable?n.length:e,s=t.count(i.id)+o,d=o>1?i.getMsgSelected(s):l;i.isError?(i.$previewContainer.removeClass("loading"),i.$previewStatus.html(""),i.$captionContainer.find(".kv-caption-icon").hide()):i.showFileIcon(),i.setCaption(d,i.isError),i.$container.removeClass("file-input-new file-input-ajax-new"),1===arguments.length&&i.raise("fileselect",[e,l]),t.count(i.id)&&i.initPreviewDeletes()},change:function(i){var a=this,n=a.$element;if(!a.isUploadable&&R(n.val())&&a.fileInputCleared)return void(a.fileInputCleared=!1);a.fileInputCleared=!1;var r,l,o,s,d=a.$preview,c=arguments.length>1,p=c?i.originalEvent.dataTransfer.files:n.get(0).files,u=R(n.attr("multiple")),f=0,v=0,h=a.filestack.length,m=a.isUploadable,g=function(i,t,n,r){var l=e.extend(a.getOutData({},{},p),{id:n,index:r}),o={id:n,index:r,file:t,files:p};return a.isUploadable?a.showUploadError(i,l):a.showError(i,o)};if(a.reader=null,a.resetUpload(),a.hideFileIcon(),a.isUploadable&&a.$container.find(".file-drop-zone ."+a.dropZoneTitleClass).remove(),c)for(r=[];p[f];)s=p[f],s.type||s.size%4096!==0?r.push(s):v++,f++;else r=void 0===i.target.files?i.target&&i.target.value?[{name:i.target.value.replace(/^.+\\/,"")}]:[]:i.target.files;if(R(r)||0===r.length)return m||a.clear(),a.showFolderError(v),void a.raise("fileselectnone");if(a.resetErrors(),o=a.isUploadable?a.getFileStack().length+r.length:r.length,a.maxFileCount>0&&o>a.maxFileCount)return l=a.msgFilesTooMany.replace("{m}",a.maxFileCount).replace("{n}",o),a.isError=g(l,null,null,null),a.$captionContainer.find(".kv-caption-icon").hide(),a.setCaption("",!0),a.setEllipsis(),void a.$container.removeClass("file-input-new file-input-ajax-new");if(!m||u&&h>0){if(a.hasInitialPreview()){var w=t.out(a.id);d.html(w.content),a.setCaption(w.caption),a.initPreviewDeletes()}else a.clearPreview();u&&h>0&&(a.filestack=[])}else!m||0!==h||t.count(a.id)&&!a.overwriteInitial||(a.clearPreview(),a.filestack=[]);a.isPreviewable?a.readFiles(r):a.updateFileDetails(1),a.showFolderError(v)},validateImage:function(e,i){var t,a,n,r,l=this,o=l.$preview,s=o.find("#"+i),d="Untitled",c=s.find("img");c.length&&c.on("load",function(){a=s.width(),n=o.width(),a>n&&(c.css("width","100%"),s.css("width","97%")),r=c.closest(".file-preview-frame").find(".file-caption-name"),r.length&&(r.width(c.width()),d=r.text(),r.attr("title",d)),t={ind:e,id:i},l.checkDimensions(e,"Small",c,s,d,"Width",t),l.checkDimensions(e,"Small",c,s,d,"Height",t),l.checkDimensions(e,"Large",c,s,d,"Width",t),l.checkDimensions(e,"Large",c,s,d,"Height",t),l.raise("fileimageloaded",[i]),W.revokeObjectURL(c.attr("src"))})},checkDimensions:function(e,i,t,a,n,r,l){var o,s,d,c,p=this,u="Small"===i?"min":"max",f=p[u+"Image"+r];!R(f)&&t.length&&(d=t[0],s="Width"===r?d.naturalWidth||d.width:d.naturalHeight||d.height,c="Small"===i?s>=f:f>=s,c||(o=p["msgImage"+r+i].replace("{name}",n).replace("{size}",f),p.showUploadError(o,l),p.setThumbStatus(a,"Error"),p.filestack[e]=null))},initCaption:function(){var e=this,i=e.initialCaption||"";return e.overwriteInitial||R(i)?(e.$caption.html(""),!1):(e.setCaption(i),!0)},setCaption:function(i,t){var a,n,r=this;if(t)a=e("<div>"+r.msgValidationError+"</div>").text(),n='<span class="'+r.msgValidationErrorClass+'">'+r.msgValidationErrorIcon+a+"</span>";else{if(R(i)||0===r.$caption.length)return;a=e("<div>"+i+"</div>").text(),n=r.getLayoutTemplate("icon")+a}r.$caption.html(n),r.$caption.attr("title",a),r.$captionContainer.find(".file-caption-ellipsis").attr("title",a),r.setEllipsis()},initBrowse:function(e){var i=this;i.$btnFile=e.find(".btn-file"),i.$btnFile.append(i.$element)},createContainer:function(){var i=this,t=e(document.createElement("span")).attr({"class":"file-input file-input-new"}).html(i.renderMain());return i.$element.before(t),i.initBrowse(t),t},refreshContainer:function(){var e=this,i=e.$container;i.before(e.$element),i.html(e.renderMain()),e.initBrowse(i)},renderMain:function(){var e=this,i=e.isUploadable&&e.dropZoneEnabled?" file-drop-zone":"",t=e.showPreview?e.getLayoutTemplate("preview").repl("{class}",e.previewClass).repl("{dropClass}",i):"",a=e.isDisabled?e.captionClass+" file-caption-disabled":e.captionClass,n=e.captionTemplate.repl("{class}",a+" kv-fileinput-caption");return e.mainTemplate.repl("{class}",e.mainClass).repl("{preview}",t).repl("{caption}",n).repl("{upload}",e.renderUpload()).repl("{remove}",e.renderRemove()).repl("{cancel}",e.renderCancel()).repl("{browse}",e.renderBrowse())},renderBrowse:function(){var e=this,i=e.browseClass+" btn-file",t="";return e.isDisabled&&(t=" disabled "),'<div class="'+i+'"'+t+"> "+e.browseIcon+e.browseLabel+" </div>"},renderRemove:function(){var e=this,i=e.removeClass+" fileinput-remove fileinput-remove-button",t="";return e.showRemove?(e.isDisabled&&(t=" disabled "),'<button type="button" title="'+e.removeTitle+'" class="'+i+'"'+t+">"+e.removeIcon+e.removeLabel+"</button>"):""},renderCancel:function(){var e=this,i=e.cancelClass+" fileinput-cancel fileinput-cancel-button";return e.showCancel?'<button type="button" title="'+e.cancelTitle+'" class="hide '+i+'">'+e.cancelIcon+e.cancelLabel+"</button>":""},renderUpload:function(){var e=this,i=e.uploadClass+" kv-fileinput-upload fileinput-upload-button",t="",a="";return e.showUpload?(e.isDisabled&&(a=" disabled "),t=!e.isUploadable||e.isDisabled?'<button type="submit" title="'+e.uploadTitle+'"class="'+i+'"'+a+">"+e.uploadIcon+e.uploadLabel+"</button>":'<a href="'+e.uploadUrl+'" title="'+e.uploadTitle+'" class="'+i+'"'+a+">"+e.uploadIcon+e.uploadLabel+"</a>"):""}},e.fn.fileinput=function(t){if(n()||i(9)){var a=Array.apply(null,arguments);return a.shift(),this.each(function(){var i,n=e(this),r=n.data("fileinput"),l="object"==typeof t&&t,o=l.language||n.data("language")||"en";r||(i=e.extend({},e.fn.fileinput.defaults),"en"===o||R(e.fn.fileinputLocales[o])||(i=e.extend(i,e.fn.fileinputLocales[o])),r=new _(this,e.extend(i,l,n.data())),n.data("fileinput",r)),"string"==typeof t&&r[t].apply(r,a)})}},e.fn.fileinput.defaults={language:"en",showCaption:!0,showPreview:!0,showRemove:!0,showUpload:!0,showCancel:!0,showUploadedThumbs:!0,mainClass:"",previewClass:"",captionClass:"",mainTemplate:null,initialCaption:"",initialPreview:[],initialPreviewDelimiter:"*$$*",initialPreviewConfig:[],initialPreviewThumbTags:[],previewThumbTags:{},initialPreviewShowDelete:!0,deleteUrl:"",deleteExtraData:{},overwriteInitial:!0,layoutTemplates:U,previewTemplates:j,allowedPreviewTypes:A,allowedPreviewMimeTypes:null,allowedFileTypes:null,allowedFileExtensions:null,customLayoutTags:{},customPreviewTags:{},previewSettings:L,fileTypeSettings:O,previewFileIcon:'<i class="glyphicon glyphicon-file"></i>',browseIcon:'<i class="glyphicon glyphicon-folder-open"></i> &nbsp;',browseClass:"btn btn-primary",removeIcon:'<i class="glyphicon glyphicon-trash"></i> ',removeClass:"btn btn-default",cancelIcon:'<i class="glyphicon glyphicon-ban-circle"></i> ',cancelClass:"btn btn-default",uploadIcon:'<i class="glyphicon glyphicon-upload"></i> ',uploadClass:"btn btn-default",uploadUrl:null,uploadAsync:!0,uploadExtraData:{},minImageWidth:null,minImageHeight:null,maxImageWidth:null,maxImageHeight:null,maxFileSize:0,minFileCount:0,maxFileCount:0,msgValidationErrorClass:"text-danger",msgValidationErrorIcon:'<i class="glyphicon glyphicon-exclamation-sign"></i> ',msgErrorClass:"file-error-message",progressClass:"progress-bar progress-bar-success progress-bar-striped active",progressCompleteClass:"progress-bar progress-bar-success",previewFileType:"image",wrapTextLength:250,wrapIndicator:' <span class="wrap-indicator" title="{title}" onclick="{dialog}">[&hellip;]</span>',elCaptionContainer:null,elCaptionText:null,elPreviewContainer:null,elPreviewImage:null,elPreviewStatus:null,elErrorContainer:null,slugCallback:null,dropZoneEnabled:!0,dropZoneTitleClass:"file-drop-zone-title",fileActionSettings:{},otherActionButtons:"",textEncoding:"UTF-8",ajaxSettings:{},ajaxDeleteSettings:{},showAjaxErrorDetails:!0},e.fn.fileinputLocales.en={fileSingle:"file",filePlural:"files",browseLabel:"Browse &hellip;",removeLabel:"Remove",removeTitle:"Clear selected files",cancelLabel:"Cancel",cancelTitle:"Abort ongoing upload",uploadLabel:"Upload",uploadTitle:"Upload selected files",msgSizeTooLarge:'File "{name}" (<b>{size} KB</b>) exceeds maximum allowed upload size of <b>{maxSize} KB</b>. Please retry your upload!',msgFilesTooLess:"You must select at least <b>{n}</b> {files} to upload. Please retry your upload!",msgFilesTooMany:"Number of files selected for upload <b>({n})</b> exceeds maximum allowed limit of <b>{m}</b>. Please retry your upload!",msgFileNotFound:'File "{name}" not found!',msgFileSecured:'Security restrictions prevent reading the file "{name}".',msgFileNotReadable:'File "{name}" is not readable.',msgFilePreviewAborted:'File preview aborted for "{name}".',msgFilePreviewError:'An error occurred while reading the file "{name}".',msgInvalidFileType:'Invalid type for file "{name}". Only "{types}" files are supported.',msgInvalidFileExtension:'Invalid extension for file "{name}". Only "{extensions}" files are supported.',msgValidationError:"File Upload Error",msgLoading:"Loading file {index} of {files} &hellip;",msgProgress:"Loading file {index} of {files} - {name} - {percent}% completed.",msgSelected:"{n} {files} selected",msgFoldersNotAllowed:"Drag & drop files only! {n} folder(s) dropped were skipped.",msgImageWidthSmall:'Width of image file "{name}" must be at least {size} px.',msgImageHeightSmall:'Height of image file "{name}" must be at least {size} px.',msgImageWidthLarge:'Width of image file "{name}" cannot exceed {size} px.',msgImageHeightLarge:'Height of image file "{name}" cannot exceed {size} px.',dropZoneTitle:"Drag & drop files here &hellip;"},e.extend(e.fn.fileinput.defaults,e.fn.fileinputLocales.en),e.fn.fileinput.Constructor=_,e(document).ready(function(){var i=e("input.file[type=file]");i.length&&i.fileinput()})}(window.jQuery);
/*!
 * FileInput French Translations
 *
 * This file must be loaded after 'fileinput.js'. Patterns in braces '{}', or
 * any HTML markup tags in the messages must not be converted or translated.
 *
 * @see http://github.com/kartik-v/bootstrap-fileinput
 *
 * NOTE: this file must be saved in UTF-8 encoding.
 */
(function ($) {
    "use strict";

    $.fn.fileinputLocales['fr'] = {
        fileSingle: 'fichier',
        filePlural: 'fichiers',
        browseLabel: 'Parcourir&hellip;',
        removeLabel: 'Retirer',
        removeTitle: 'Retirer les fichiers sélectionnés',
        cancelLabel: 'Annuler',
        cancelTitle: "Annuler l'envoi en cours",
        uploadLabel: 'Transférer',
        uploadTitle: 'Transférer les fichiers sélectionnés',
        msgSizeTooLarge: 'Le fichier "{name}" (<b>{size} KB</b>) dépasse la taille maximale autorisée qui est de <b>{maxSize} KB</b>. Merci de recommencer !',
        msgFilesTooLess: 'Vous devez sélectionner au moins <b>{n}</b> {files} à transmetter. Merci de recommencer !',
        msgFilesTooMany: 'Le nombre de fichier sélectionné <b>({n})</b> dépasse la quantité maximale autorisée qui est de <b>{m}</b>. Merci de recommencer !',
        msgFileNotFound: 'Le fichier "{name}" est introuvable !',
        msgFileSecured: "Des restrictions de sécurité vous empêchent d'accéder au fichier \"{name}\".",
        msgFileNotReadable: 'Le fichier "{name}" est illisble.',
        msgFilePreviewAborted: 'Prévisualisation du fichier "{name}" annulée.',
        msgFilePreviewError: 'Une erreur est survenue lors de la lecture du fichier "{name}".',
        msgInvalidFileType: 'Type de document invalide pour "{name}". Seulement les documents de type "{types}" sont autorisés.',
        msgInvalidFileExtension: 'Extension invalide pour le fichier "{name}". Seules les extensions "{extensions}" sont autorisées.',
        msgValidationError: 'Erreur lors de la transmission du fichier',
        msgLoading: 'Transmission du fichier {index} sur {files}&hellip;',
        msgProgress: 'Transmission du fichier {index} sur {files} - {name} - {percent}% faits.',
        msgSelected: '{n} {files} sélectionné(s)',
        msgFoldersNotAllowed: 'Glissez et déposez uniquement des fichiers ! {n} répertoire(s) exclu(s).',
        msgImageWidthSmall: 'Largeur de fichier image "{name}" doit être d\'au moins {size} px.',
        msgImageHeightSmall: 'Hauteur de fichier image "{name}" doit être d\'au moins {size} px.',
        msgImageWidthLarge: 'Largeur de fichier image "{name}" ne peut pas dépasser {size} px.',
        msgImageHeightLarge: 'Hauteur de fichier image "{name}" ne peut pas dépasser {size} px.',
        dropZoneTitle: 'Glissez et déposez les fichiers ici&hellip;'
    };
})(window.jQuery);
/*!
 * Datepicker for Bootstrap v1.5.0-dev (https://github.com/eternicode/bootstrap-datepicker)
 *
 * Copyright 2012 Stefan Petre
 * Improvements by Andrew Rowls
 * Licensed under the Apache License v2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 */
!function(a,b){function c(){return new Date(Date.UTC.apply(Date,arguments))}function d(){var a=new Date;return c(a.getFullYear(),a.getMonth(),a.getDate())}function e(a,b){return a.getUTCFullYear()===b.getUTCFullYear()&&a.getUTCMonth()===b.getUTCMonth()&&a.getUTCDate()===b.getUTCDate()}function f(a){return function(){return this[a].apply(this,arguments)}}function g(b,c){function d(a,b){return b.toLowerCase()}var e,f=a(b).data(),g={},h=new RegExp("^"+c.toLowerCase()+"([A-Z])");c=new RegExp("^"+c.toLowerCase());for(var i in f)c.test(i)&&(e=i.replace(h,d),g[e]=f[i]);return g}function h(b){var c={};if(p[b]||(b=b.split("-")[0],p[b])){var d=p[b];return a.each(o,function(a,b){b in d&&(c[b]=d[b])}),c}}var i=function(){var b={get:function(a){return this.slice(a)[0]},contains:function(a){for(var b=a&&a.valueOf(),c=0,d=this.length;d>c;c++)if(this[c].valueOf()===b)return c;return-1},remove:function(a){this.splice(a,1)},replace:function(b){b&&(a.isArray(b)||(b=[b]),this.clear(),this.push.apply(this,b))},clear:function(){this.length=0},copy:function(){var a=new i;return a.replace(this),a}};return function(){var c=[];return c.push.apply(c,arguments),a.extend(c,b),c}}(),j=function(b,c){this._process_options(c),this.dates=new i,this.viewDate=this.o.defaultViewDate,this.focusDate=null,this.element=a(b),this.isInline=!1,this.isInput=this.element.is("input"),this.component=this.element.hasClass("date")?this.element.find(".add-on, .input-group-addon, .btn"):!1,this.hasInput=this.component&&this.element.find("input").length,this.component&&0===this.component.length&&(this.component=!1),this.picker=a(q.template),this._buildEvents(),this._attachEvents(),this.isInline?this.picker.addClass("datepicker-inline").appendTo(this.element):this.picker.addClass("datepicker-dropdown dropdown-menu"),this.o.rtl&&this.picker.addClass("datepicker-rtl"),this.viewMode=this.o.startView,this.o.calendarWeeks&&this.picker.find("tfoot .today, tfoot .clear").attr("colspan",function(a,b){return parseInt(b)+1}),this._allow_update=!1,this.setStartDate(this._o.startDate),this.setEndDate(this._o.endDate),this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled),this.setDatesDisabled(this.o.datesDisabled),this.fillDow(),this.fillMonths(),this._allow_update=!0,this.update(),this.showMode(),this.isInline&&this.show()};j.prototype={constructor:j,_process_options:function(e){this._o=a.extend({},this._o,e);var f=this.o=a.extend({},this._o),g=f.language;switch(p[g]||(g=g.split("-")[0],p[g]||(g=n.language)),f.language=g,f.startView){case 2:case"decade":f.startView=2;break;case 1:case"year":f.startView=1;break;default:f.startView=0}switch(f.minViewMode){case 1:case"months":f.minViewMode=1;break;case 2:case"years":f.minViewMode=2;break;default:f.minViewMode=0}f.startView=Math.max(f.startView,f.minViewMode),f.multidate!==!0&&(f.multidate=Number(f.multidate)||!1,f.multidate!==!1&&(f.multidate=Math.max(0,f.multidate))),f.multidateSeparator=String(f.multidateSeparator),f.weekStart%=7,f.weekEnd=(f.weekStart+6)%7;var h=q.parseFormat(f.format);if(f.startDate!==-1/0&&(f.startDate=f.startDate?f.startDate instanceof Date?this._local_to_utc(this._zero_time(f.startDate)):q.parseDate(f.startDate,h,f.language):-1/0),1/0!==f.endDate&&(f.endDate=f.endDate?f.endDate instanceof Date?this._local_to_utc(this._zero_time(f.endDate)):q.parseDate(f.endDate,h,f.language):1/0),f.daysOfWeekDisabled=f.daysOfWeekDisabled||[],a.isArray(f.daysOfWeekDisabled)||(f.daysOfWeekDisabled=f.daysOfWeekDisabled.split(/[,\s]*/)),f.daysOfWeekDisabled=a.map(f.daysOfWeekDisabled,function(a){return parseInt(a,10)}),f.datesDisabled=f.datesDisabled||[],!a.isArray(f.datesDisabled)){var i=[];i.push(q.parseDate(f.datesDisabled,h,f.language)),f.datesDisabled=i}f.datesDisabled=a.map(f.datesDisabled,function(a){return q.parseDate(a,h,f.language)});var j=String(f.orientation).toLowerCase().split(/\s+/g),k=f.orientation.toLowerCase();if(j=a.grep(j,function(a){return/^auto|left|right|top|bottom$/.test(a)}),f.orientation={x:"auto",y:"auto"},k&&"auto"!==k)if(1===j.length)switch(j[0]){case"top":case"bottom":f.orientation.y=j[0];break;case"left":case"right":f.orientation.x=j[0]}else k=a.grep(j,function(a){return/^left|right$/.test(a)}),f.orientation.x=k[0]||"auto",k=a.grep(j,function(a){return/^top|bottom$/.test(a)}),f.orientation.y=k[0]||"auto";else;if(f.defaultViewDate){var l=f.defaultViewDate.year||(new Date).getFullYear(),m=f.defaultViewDate.month||0,o=f.defaultViewDate.day||1;f.defaultViewDate=c(l,m,o)}else f.defaultViewDate=d();f.showOnFocus=f.showOnFocus!==b?f.showOnFocus:!0},_events:[],_secondaryEvents:[],_applyEvents:function(a){for(var c,d,e,f=0;f<a.length;f++)c=a[f][0],2===a[f].length?(d=b,e=a[f][1]):3===a[f].length&&(d=a[f][1],e=a[f][2]),c.on(e,d)},_unapplyEvents:function(a){for(var c,d,e,f=0;f<a.length;f++)c=a[f][0],2===a[f].length?(e=b,d=a[f][1]):3===a[f].length&&(e=a[f][1],d=a[f][2]),c.off(d,e)},_buildEvents:function(){var b={keyup:a.proxy(function(b){-1===a.inArray(b.keyCode,[27,37,39,38,40,32,13,9])&&this.update()},this),keydown:a.proxy(this.keydown,this),paste:a.proxy(this.paste,this)};this.o.showOnFocus===!0&&(b.focus=a.proxy(this.show,this)),this.isInput?this._events=[[this.element,b]]:this.component&&this.hasInput?this._events=[[this.element.find("input"),b],[this.component,{click:a.proxy(this.show,this)}]]:this.element.is("div")?this.isInline=!0:this._events=[[this.element,{click:a.proxy(this.show,this)}]],this._events.push([this.element,"*",{blur:a.proxy(function(a){this._focused_from=a.target},this)}],[this.element,{blur:a.proxy(function(a){this._focused_from=a.target},this)}]),this.o.immediateUpdates&&this._events.push([this.element,{"changeYear changeMonth":a.proxy(function(a){this.update(a.date)},this)}]),this._secondaryEvents=[[this.picker,{click:a.proxy(this.click,this)}],[a(window),{resize:a.proxy(this.place,this)}],[a(document),{mousedown:a.proxy(function(b){this.element.is(b.target)||this.element.find(b.target).length||this.picker.is(b.target)||this.picker.find(b.target).length||a(this.picker).hide()},this)}]]},_attachEvents:function(){this._detachEvents(),this._applyEvents(this._events)},_detachEvents:function(){this._unapplyEvents(this._events)},_attachSecondaryEvents:function(){this._detachSecondaryEvents(),this._applyEvents(this._secondaryEvents)},_detachSecondaryEvents:function(){this._unapplyEvents(this._secondaryEvents)},_trigger:function(b,c){var d=c||this.dates.get(-1),e=this._utc_to_local(d);this.element.trigger({type:b,date:e,dates:a.map(this.dates,this._utc_to_local),format:a.proxy(function(a,b){0===arguments.length?(a=this.dates.length-1,b=this.o.format):"string"==typeof a&&(b=a,a=this.dates.length-1),b=b||this.o.format;var c=this.dates.get(a);return q.formatDate(c,b,this.o.language)},this)})},show:function(){return this.element.attr("readonly")&&this.o.enableOnReadonly===!1?void 0:(this.isInline||this.picker.appendTo(this.o.container),this.place(),this.picker.show(),this._attachSecondaryEvents(),this._trigger("show"),(window.navigator.msMaxTouchPoints||"ontouchstart"in document)&&this.o.disableTouchKeyboard&&a(this.element).blur(),this)},hide:function(){return this.isInline?this:this.picker.is(":visible")?(this.focusDate=null,this.picker.hide().detach(),this._detachSecondaryEvents(),this.viewMode=this.o.startView,this.showMode(),this.o.forceParse&&(this.isInput&&this.element.val()||this.hasInput&&this.element.find("input").val())&&this.setValue(),this._trigger("hide"),this):this},remove:function(){return this.hide(),this._detachEvents(),this._detachSecondaryEvents(),this.picker.remove(),delete this.element.data().datepicker,this.isInput||delete this.element.data().date,this},paste:function(b){var c;if(b.originalEvent.clipboardData&&b.originalEvent.clipboardData.types&&-1!==a.inArray("text/plain",b.originalEvent.clipboardData.types))c=b.originalEvent.clipboardData.getData("text/plain");else{if(!window.clipboardData)return;c=window.clipboardData.getData("Text")}this.setDate(c),this.update(),b.preventDefault()},_utc_to_local:function(a){return a&&new Date(a.getTime()+6e4*a.getTimezoneOffset())},_local_to_utc:function(a){return a&&new Date(a.getTime()-6e4*a.getTimezoneOffset())},_zero_time:function(a){return a&&new Date(a.getFullYear(),a.getMonth(),a.getDate())},_zero_utc_time:function(a){return a&&new Date(Date.UTC(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate()))},getDates:function(){return a.map(this.dates,this._utc_to_local)},getUTCDates:function(){return a.map(this.dates,function(a){return new Date(a)})},getDate:function(){return this._utc_to_local(this.getUTCDate())},getUTCDate:function(){var a=this.dates.get(-1);return"undefined"!=typeof a?new Date(a):null},clearDates:function(){var a;this.isInput?a=this.element:this.component&&(a=this.element.find("input")),a&&a.val("").change(),this.update(),this._trigger("changeDate"),this.o.autoclose&&this.hide()},setDates:function(){var b=a.isArray(arguments[0])?arguments[0]:arguments;return this.update.apply(this,b),this._trigger("changeDate"),this.setValue(),this},setUTCDates:function(){var b=a.isArray(arguments[0])?arguments[0]:arguments;return this.update.apply(this,a.map(b,this._utc_to_local)),this._trigger("changeDate"),this.setValue(),this},setDate:f("setDates"),setUTCDate:f("setUTCDates"),setValue:function(){var a=this.getFormattedDate();return this.isInput?this.element.val(a).change():this.component&&this.element.find("input").val(a).change(),this},getFormattedDate:function(c){c===b&&(c=this.o.format);var d=this.o.language;return a.map(this.dates,function(a){return q.formatDate(a,c,d)}).join(this.o.multidateSeparator)},setStartDate:function(a){return this._process_options({startDate:a}),this.update(),this.updateNavArrows(),this},setEndDate:function(a){return this._process_options({endDate:a}),this.update(),this.updateNavArrows(),this},setDaysOfWeekDisabled:function(a){return this._process_options({daysOfWeekDisabled:a}),this.update(),this.updateNavArrows(),this},setDatesDisabled:function(a){this._process_options({datesDisabled:a}),this.update(),this.updateNavArrows()},place:function(){if(this.isInline)return this;var b=this.picker.outerWidth(),c=this.picker.outerHeight(),d=10,e=a(this.o.container).width(),f=a(this.o.container).height(),g=a(this.o.container).scrollTop(),h=a(this.o.container).offset(),i=[];this.element.parents().each(function(){var b=a(this).css("z-index");"auto"!==b&&0!==b&&i.push(parseInt(b))});var j=Math.max.apply(Math,i)+10,k=this.component?this.component.parent().offset():this.element.offset(),l=this.component?this.component.outerHeight(!0):this.element.outerHeight(!1),m=this.component?this.component.outerWidth(!0):this.element.outerWidth(!1),n=k.left-h.left,o=k.top-h.top;this.picker.removeClass("datepicker-orient-top datepicker-orient-bottom datepicker-orient-right datepicker-orient-left"),"auto"!==this.o.orientation.x?(this.picker.addClass("datepicker-orient-"+this.o.orientation.x),"right"===this.o.orientation.x&&(n-=b-m)):k.left<0?(this.picker.addClass("datepicker-orient-left"),n-=k.left-d):n+b>e?(this.picker.addClass("datepicker-orient-right"),n=k.left+m-b):this.picker.addClass("datepicker-orient-left");var p,q,r=this.o.orientation.y;if("auto"===r&&(p=-g+o-c,q=g+f-(o+l+c),r=Math.max(p,q)===q?"top":"bottom"),this.picker.addClass("datepicker-orient-"+r),"top"===r?o+=l:o-=c+parseInt(this.picker.css("padding-top")),this.o.rtl){var s=e-(n+m);this.picker.css({top:o,right:s,zIndex:j})}else this.picker.css({top:o,left:n,zIndex:j});return this},_allow_update:!0,update:function(){if(!this._allow_update)return this;var b=this.dates.copy(),c=[],d=!1;return arguments.length?(a.each(arguments,a.proxy(function(a,b){b instanceof Date&&(b=this._local_to_utc(b)),c.push(b)},this)),d=!0):(c=this.isInput?this.element.val():this.element.data("date")||this.element.find("input").val(),c=c&&this.o.multidate?c.split(this.o.multidateSeparator):[c],delete this.element.data().date),c=a.map(c,a.proxy(function(a){return q.parseDate(a,this.o.format,this.o.language)},this)),c=a.grep(c,a.proxy(function(a){return a<this.o.startDate||a>this.o.endDate||!a},this),!0),this.dates.replace(c),this.dates.length?this.viewDate=new Date(this.dates.get(-1)):this.viewDate<this.o.startDate?this.viewDate=new Date(this.o.startDate):this.viewDate>this.o.endDate&&(this.viewDate=new Date(this.o.endDate)),d?this.setValue():c.length&&String(b)!==String(this.dates)&&this._trigger("changeDate"),!this.dates.length&&b.length&&this._trigger("clearDate"),this.fill(),this},fillDow:function(){var a=this.o.weekStart,b="<tr>";if(this.o.calendarWeeks){this.picker.find(".datepicker-days thead tr:first-child .datepicker-switch").attr("colspan",function(a,b){return parseInt(b)+1});var c='<th class="cw">&#160;</th>';b+=c}for(;a<this.o.weekStart+7;)b+='<th class="dow">'+p[this.o.language].daysMin[a++%7]+"</th>";b+="</tr>",this.picker.find(".datepicker-days thead").append(b)},fillMonths:function(){for(var a="",b=0;12>b;)a+='<span class="month">'+p[this.o.language].monthsShort[b++]+"</span>";this.picker.find(".datepicker-months td").html(a)},setRange:function(b){b&&b.length?this.range=a.map(b,function(a){return a.valueOf()}):delete this.range,this.fill()},getClassNames:function(b){var c=[],d=this.viewDate.getUTCFullYear(),f=this.viewDate.getUTCMonth(),g=new Date;return b.getUTCFullYear()<d||b.getUTCFullYear()===d&&b.getUTCMonth()<f?c.push("old"):(b.getUTCFullYear()>d||b.getUTCFullYear()===d&&b.getUTCMonth()>f)&&c.push("new"),this.focusDate&&b.valueOf()===this.focusDate.valueOf()&&c.push("focused"),this.o.todayHighlight&&b.getUTCFullYear()===g.getFullYear()&&b.getUTCMonth()===g.getMonth()&&b.getUTCDate()===g.getDate()&&c.push("today"),-1!==this.dates.contains(b)&&c.push("active"),(b.valueOf()<this.o.startDate||b.valueOf()>this.o.endDate||-1!==a.inArray(b.getUTCDay(),this.o.daysOfWeekDisabled))&&c.push("disabled"),this.o.datesDisabled.length>0&&a.grep(this.o.datesDisabled,function(a){return e(b,a)}).length>0&&c.push("disabled","disabled-date"),this.range&&(b>this.range[0]&&b<this.range[this.range.length-1]&&c.push("range"),-1!==a.inArray(b.valueOf(),this.range)&&c.push("selected")),c},fill:function(){var d,e=new Date(this.viewDate),f=e.getUTCFullYear(),g=e.getUTCMonth(),h=this.o.startDate!==-1/0?this.o.startDate.getUTCFullYear():-1/0,i=this.o.startDate!==-1/0?this.o.startDate.getUTCMonth():-1/0,j=1/0!==this.o.endDate?this.o.endDate.getUTCFullYear():1/0,k=1/0!==this.o.endDate?this.o.endDate.getUTCMonth():1/0,l=p[this.o.language].today||p.en.today||"",m=p[this.o.language].clear||p.en.clear||"";if(!isNaN(f)&&!isNaN(g)){this.picker.find(".datepicker-days thead .datepicker-switch").text(p[this.o.language].months[g]+" "+f),this.picker.find("tfoot .today").text(l).toggle(this.o.todayBtn!==!1),this.picker.find("tfoot .clear").text(m).toggle(this.o.clearBtn!==!1),this.updateNavArrows(),this.fillMonths();var n=c(f,g-1,28),o=q.getDaysInMonth(n.getUTCFullYear(),n.getUTCMonth());n.setUTCDate(o),n.setUTCDate(o-(n.getUTCDay()-this.o.weekStart+7)%7);var r=new Date(n);r.setUTCDate(r.getUTCDate()+42),r=r.valueOf();for(var s,t=[];n.valueOf()<r;){if(n.getUTCDay()===this.o.weekStart&&(t.push("<tr>"),this.o.calendarWeeks)){var u=new Date(+n+(this.o.weekStart-n.getUTCDay()-7)%7*864e5),v=new Date(Number(u)+(11-u.getUTCDay())%7*864e5),w=new Date(Number(w=c(v.getUTCFullYear(),0,1))+(11-w.getUTCDay())%7*864e5),x=(v-w)/864e5/7+1;t.push('<td class="cw">'+x+"</td>")}if(s=this.getClassNames(n),s.push("day"),this.o.beforeShowDay!==a.noop){var y=this.o.beforeShowDay(this._utc_to_local(n));y===b?y={}:"boolean"==typeof y?y={enabled:y}:"string"==typeof y&&(y={classes:y}),y.enabled===!1&&s.push("disabled"),y.classes&&(s=s.concat(y.classes.split(/\s+/))),y.tooltip&&(d=y.tooltip)}s=a.unique(s),t.push('<td class="'+s.join(" ")+'"'+(d?' title="'+d+'"':"")+">"+n.getUTCDate()+"</td>"),d=null,n.getUTCDay()===this.o.weekEnd&&t.push("</tr>"),n.setUTCDate(n.getUTCDate()+1)}this.picker.find(".datepicker-days tbody").empty().append(t.join(""));var z=this.picker.find(".datepicker-months").find("th:eq(1)").text(f).end().find("span").removeClass("active");if(a.each(this.dates,function(a,b){b.getUTCFullYear()===f&&z.eq(b.getUTCMonth()).addClass("active")}),(h>f||f>j)&&z.addClass("disabled"),f===h&&z.slice(0,i).addClass("disabled"),f===j&&z.slice(k+1).addClass("disabled"),this.o.beforeShowMonth!==a.noop){var A=this;a.each(z,function(b,c){if(!a(c).hasClass("disabled")){var d=new Date(f,b,1),e=A.o.beforeShowMonth(d);e===!1&&a(c).addClass("disabled")}})}t="",f=10*parseInt(f/10,10);var B=this.picker.find(".datepicker-years").find("th:eq(1)").text(f+"-"+(f+9)).end().find("td");f-=1;for(var C,D=a.map(this.dates,function(a){return a.getUTCFullYear()}),E=-1;11>E;E++)C=["year"],-1===E?C.push("old"):10===E&&C.push("new"),-1!==a.inArray(f,D)&&C.push("active"),(h>f||f>j)&&C.push("disabled"),t+='<span class="'+C.join(" ")+'">'+f+"</span>",f+=1;B.html(t)}},updateNavArrows:function(){if(this._allow_update){var a=new Date(this.viewDate),b=a.getUTCFullYear(),c=a.getUTCMonth();switch(this.viewMode){case 0:this.picker.find(".prev").css(this.o.startDate!==-1/0&&b<=this.o.startDate.getUTCFullYear()&&c<=this.o.startDate.getUTCMonth()?{visibility:"hidden"}:{visibility:"visible"}),this.picker.find(".next").css(1/0!==this.o.endDate&&b>=this.o.endDate.getUTCFullYear()&&c>=this.o.endDate.getUTCMonth()?{visibility:"hidden"}:{visibility:"visible"});break;case 1:case 2:this.picker.find(".prev").css(this.o.startDate!==-1/0&&b<=this.o.startDate.getUTCFullYear()?{visibility:"hidden"}:{visibility:"visible"}),this.picker.find(".next").css(1/0!==this.o.endDate&&b>=this.o.endDate.getUTCFullYear()?{visibility:"hidden"}:{visibility:"visible"})}}},click:function(b){b.preventDefault();var d,e,f,g=a(b.target).closest("span, td, th");if(1===g.length)switch(g[0].nodeName.toLowerCase()){case"th":switch(g[0].className){case"datepicker-switch":this.showMode(1);break;case"prev":case"next":var h=q.modes[this.viewMode].navStep*("prev"===g[0].className?-1:1);switch(this.viewMode){case 0:this.viewDate=this.moveMonth(this.viewDate,h),this._trigger("changeMonth",this.viewDate);break;case 1:case 2:this.viewDate=this.moveYear(this.viewDate,h),1===this.viewMode&&this._trigger("changeYear",this.viewDate)}this.fill();break;case"today":var i=new Date;i=c(i.getFullYear(),i.getMonth(),i.getDate(),0,0,0),this.showMode(-2);var j="linked"===this.o.todayBtn?null:"view";this._setDate(i,j);break;case"clear":this.clearDates()}break;case"span":g.hasClass("disabled")||(this.viewDate.setUTCDate(1),g.hasClass("month")?(f=1,e=g.parent().find("span").index(g),d=this.viewDate.getUTCFullYear(),this.viewDate.setUTCMonth(e),this._trigger("changeMonth",this.viewDate),1===this.o.minViewMode?(this._setDate(c(d,e,f)),this.showMode()):this.showMode(-1)):(f=1,e=0,d=parseInt(g.text(),10)||0,this.viewDate.setUTCFullYear(d),this._trigger("changeYear",this.viewDate),2===this.o.minViewMode&&this._setDate(c(d,e,f)),this.showMode(-1)),this.fill());break;case"td":g.hasClass("day")&&!g.hasClass("disabled")&&(f=parseInt(g.text(),10)||1,d=this.viewDate.getUTCFullYear(),e=this.viewDate.getUTCMonth(),g.hasClass("old")?0===e?(e=11,d-=1):e-=1:g.hasClass("new")&&(11===e?(e=0,d+=1):e+=1),this._setDate(c(d,e,f)))}this.picker.is(":visible")&&this._focused_from&&a(this._focused_from).focus(),delete this._focused_from},_toggle_multidate:function(a){var b=this.dates.contains(a);if(a||this.dates.clear(),-1!==b?(this.o.multidate===!0||this.o.multidate>1||this.o.toggleActive)&&this.dates.remove(b):this.o.multidate===!1?(this.dates.clear(),this.dates.push(a)):this.dates.push(a),"number"==typeof this.o.multidate)for(;this.dates.length>this.o.multidate;)this.dates.remove(0)},_setDate:function(a,b){b&&"date"!==b||this._toggle_multidate(a&&new Date(a)),b&&"view"!==b||(this.viewDate=a&&new Date(a)),this.fill(),this.setValue(),b&&"view"===b||this._trigger("changeDate");var c;this.isInput?c=this.element:this.component&&(c=this.element.find("input")),c&&c.change(),!this.o.autoclose||b&&"date"!==b||this.hide()},moveMonth:function(a,c){if(!a)return b;if(!c)return a;var d,e,f=new Date(a.valueOf()),g=f.getUTCDate(),h=f.getUTCMonth(),i=Math.abs(c);if(c=c>0?1:-1,1===i)e=-1===c?function(){return f.getUTCMonth()===h}:function(){return f.getUTCMonth()!==d},d=h+c,f.setUTCMonth(d),(0>d||d>11)&&(d=(d+12)%12);else{for(var j=0;i>j;j++)f=this.moveMonth(f,c);d=f.getUTCMonth(),f.setUTCDate(g),e=function(){return d!==f.getUTCMonth()}}for(;e();)f.setUTCDate(--g),f.setUTCMonth(d);return f},moveYear:function(a,b){return this.moveMonth(a,12*b)},dateWithinRange:function(a){return a>=this.o.startDate&&a<=this.o.endDate},keydown:function(a){if(!this.picker.is(":visible"))return void((40===a.keyCode||27===a.keyCode)&&this.show());var b,c,e,f=!1,g=this.focusDate||this.viewDate;switch(a.keyCode){case 27:this.focusDate?(this.focusDate=null,this.viewDate=this.dates.get(-1)||this.viewDate,this.fill()):this.hide(),a.preventDefault();break;case 37:case 39:if(!this.o.keyboardNavigation)break;b=37===a.keyCode?-1:1,a.ctrlKey?(c=this.moveYear(this.dates.get(-1)||d(),b),e=this.moveYear(g,b),this._trigger("changeYear",this.viewDate)):a.shiftKey?(c=this.moveMonth(this.dates.get(-1)||d(),b),e=this.moveMonth(g,b),this._trigger("changeMonth",this.viewDate)):(c=new Date(this.dates.get(-1)||d()),c.setUTCDate(c.getUTCDate()+b),e=new Date(g),e.setUTCDate(g.getUTCDate()+b)),this.dateWithinRange(e)&&(this.focusDate=this.viewDate=e,this.setValue(),this.fill(),a.preventDefault());break;case 38:case 40:if(!this.o.keyboardNavigation)break;b=38===a.keyCode?-1:1,a.ctrlKey?(c=this.moveYear(this.dates.get(-1)||d(),b),e=this.moveYear(g,b),this._trigger("changeYear",this.viewDate)):a.shiftKey?(c=this.moveMonth(this.dates.get(-1)||d(),b),e=this.moveMonth(g,b),this._trigger("changeMonth",this.viewDate)):(c=new Date(this.dates.get(-1)||d()),c.setUTCDate(c.getUTCDate()+7*b),e=new Date(g),e.setUTCDate(g.getUTCDate()+7*b)),this.dateWithinRange(e)&&(this.focusDate=this.viewDate=e,this.setValue(),this.fill(),a.preventDefault());break;case 32:break;case 13:g=this.focusDate||this.dates.get(-1)||this.viewDate,this.o.keyboardNavigation&&(this._toggle_multidate(g),f=!0),this.focusDate=null,this.viewDate=this.dates.get(-1)||this.viewDate,this.setValue(),this.fill(),this.picker.is(":visible")&&(a.preventDefault(),"function"==typeof a.stopPropagation?a.stopPropagation():a.cancelBubble=!0,this.o.autoclose&&this.hide());break;case 9:this.focusDate=null,this.viewDate=this.dates.get(-1)||this.viewDate,this.fill(),this.hide()}if(f){this._trigger(this.dates.length?"changeDate":"clearDate");var h;this.isInput?h=this.element:this.component&&(h=this.element.find("input")),h&&h.change()}},showMode:function(a){a&&(this.viewMode=Math.max(this.o.minViewMode,Math.min(2,this.viewMode+a))),this.picker.children("div").hide().filter(".datepicker-"+q.modes[this.viewMode].clsName).css("display","block"),this.updateNavArrows()}};var k=function(b,c){this.element=a(b),this.inputs=a.map(c.inputs,function(a){return a.jquery?a[0]:a}),delete c.inputs,m.call(a(this.inputs),c).on("changeDate",a.proxy(this.dateUpdated,this)),this.pickers=a.map(this.inputs,function(b){return a(b).data("datepicker")}),this.updateDates()};k.prototype={updateDates:function(){this.dates=a.map(this.pickers,function(a){return a.getUTCDate()}),this.updateRanges()},updateRanges:function(){var b=a.map(this.dates,function(a){return a.valueOf()});a.each(this.pickers,function(a,c){c.setRange(b)})},dateUpdated:function(b){if(!this.updating){this.updating=!0;var c=a(b.target).data("datepicker"),d=c.getUTCDate(),e=a.inArray(b.target,this.inputs),f=e-1,g=e+1,h=this.inputs.length;if(-1!==e){if(a.each(this.pickers,function(a,b){b.getUTCDate()||b.setUTCDate(d)}),d<this.dates[f])for(;f>=0&&d<this.dates[f];)this.pickers[f--].setUTCDate(d);else if(d>this.dates[g])for(;h>g&&d>this.dates[g];)this.pickers[g++].setUTCDate(d);this.updateDates(),delete this.updating}}},remove:function(){a.map(this.pickers,function(a){a.remove()}),delete this.element.data().datepicker}};var l=a.fn.datepicker,m=function(c){var d=Array.apply(null,arguments);d.shift();var e;return this.each(function(){var f=a(this),i=f.data("datepicker"),l="object"==typeof c&&c;if(!i){var m=g(this,"date"),o=a.extend({},n,m,l),p=h(o.language),q=a.extend({},n,p,m,l);if(f.hasClass("input-daterange")||q.inputs){var r={inputs:q.inputs||f.find("input").toArray()};f.data("datepicker",i=new k(this,a.extend(q,r)))}else f.data("datepicker",i=new j(this,q))}return"string"==typeof c&&"function"==typeof i[c]&&(e=i[c].apply(i,d),e!==b)?!1:void 0}),e!==b?e:this};a.fn.datepicker=m;var n=a.fn.datepicker.defaults={autoclose:!1,beforeShowDay:a.noop,beforeShowMonth:a.noop,calendarWeeks:!1,clearBtn:!1,toggleActive:!1,daysOfWeekDisabled:[],datesDisabled:[],endDate:1/0,forceParse:!0,format:"mm/dd/yyyy",keyboardNavigation:!0,language:"en",minViewMode:0,multidate:!1,multidateSeparator:",",orientation:"auto",rtl:!1,startDate:-1/0,startView:0,todayBtn:!1,todayHighlight:!1,weekStart:0,disableTouchKeyboard:!1,enableOnReadonly:!0,container:"body",immediateUpdates:!1},o=a.fn.datepicker.locale_opts=["format","rtl","weekStart"];a.fn.datepicker.Constructor=j;var p=a.fn.datepicker.dates={en:{days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],daysShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],daysMin:["Su","Mo","Tu","We","Th","Fr","Sa"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],monthsShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],today:"Today",clear:"Clear"}},q={modes:[{clsName:"days",navFnc:"Month",navStep:1},{clsName:"months",navFnc:"FullYear",navStep:1},{clsName:"years",navFnc:"FullYear",navStep:10}],isLeapYear:function(a){return a%4===0&&a%100!==0||a%400===0},getDaysInMonth:function(a,b){return[31,q.isLeapYear(a)?29:28,31,30,31,30,31,31,30,31,30,31][b]},validParts:/dd?|DD?|mm?|MM?|yy(?:yy)?/g,nonpunctuation:/[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,parseFormat:function(a){var b=a.replace(this.validParts,"\x00").split("\x00"),c=a.match(this.validParts);if(!b||!b.length||!c||0===c.length)throw new Error("Invalid date format.");return{separators:b,parts:c}},parseDate:function(d,e,f){function g(){var a=this.slice(0,m[k].length),b=m[k].slice(0,a.length);return a.toLowerCase()===b.toLowerCase()}if(!d)return b;if(d instanceof Date)return d;"string"==typeof e&&(e=q.parseFormat(e));var h,i,k,l=/([\-+]\d+)([dmwy])/,m=d.match(/([\-+]\d+)([dmwy])/g);if(/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(d)){for(d=new Date,k=0;k<m.length;k++)switch(h=l.exec(m[k]),i=parseInt(h[1]),h[2]){case"d":d.setUTCDate(d.getUTCDate()+i);break;case"m":d=j.prototype.moveMonth.call(j.prototype,d,i);break;case"w":d.setUTCDate(d.getUTCDate()+7*i);break;case"y":d=j.prototype.moveYear.call(j.prototype,d,i)}return c(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),0,0,0)}m=d&&d.match(this.nonpunctuation)||[],d=new Date;var n,o,r={},s=["yyyy","yy","M","MM","m","mm","d","dd"],t={yyyy:function(a,b){return a.setUTCFullYear(b)},yy:function(a,b){return a.setUTCFullYear(2e3+b)},m:function(a,b){if(isNaN(a))return a;for(b-=1;0>b;)b+=12;for(b%=12,a.setUTCMonth(b);a.getUTCMonth()!==b;)a.setUTCDate(a.getUTCDate()-1);return a},d:function(a,b){return a.setUTCDate(b)}};t.M=t.MM=t.mm=t.m,t.dd=t.d,d=c(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0);var u=e.parts.slice();if(m.length!==u.length&&(u=a(u).filter(function(b,c){return-1!==a.inArray(c,s)}).toArray()),m.length===u.length){var v;for(k=0,v=u.length;v>k;k++){if(n=parseInt(m[k],10),h=u[k],isNaN(n))switch(h){case"MM":o=a(p[f].months).filter(g),n=a.inArray(o[0],p[f].months)+1;break;case"M":o=a(p[f].monthsShort).filter(g),n=a.inArray(o[0],p[f].monthsShort)+1}r[h]=n}var w,x;for(k=0;k<s.length;k++)x=s[k],x in r&&!isNaN(r[x])&&(w=new Date(d),t[x](w,r[x]),isNaN(w)||(d=w))}return d},formatDate:function(b,c,d){if(!b)return"";"string"==typeof c&&(c=q.parseFormat(c));var e={d:b.getUTCDate(),D:p[d].daysShort[b.getUTCDay()],DD:p[d].days[b.getUTCDay()],m:b.getUTCMonth()+1,M:p[d].monthsShort[b.getUTCMonth()],MM:p[d].months[b.getUTCMonth()],yy:b.getUTCFullYear().toString().substring(2),yyyy:b.getUTCFullYear()};e.dd=(e.d<10?"0":"")+e.d,e.mm=(e.m<10?"0":"")+e.m,b=[];for(var f=a.extend([],c.separators),g=0,h=c.parts.length;h>=g;g++)f.length&&b.push(f.shift()),b.push(e[c.parts[g]]);return b.join("")},headTemplate:'<thead><tr><th class="prev">&#171;</th><th colspan="5" class="datepicker-switch"></th><th class="next">&#187;</th></tr></thead>',contTemplate:'<tbody><tr><td colspan="7"></td></tr></tbody>',footTemplate:'<tfoot><tr><th colspan="7" class="today"></th></tr><tr><th colspan="7" class="clear"></th></tr></tfoot>'};q.template='<div class="datepicker"><div class="datepicker-days"><table class=" table-condensed">'+q.headTemplate+"<tbody></tbody>"+q.footTemplate+'</table></div><div class="datepicker-months"><table class="table-condensed">'+q.headTemplate+q.contTemplate+q.footTemplate+'</table></div><div class="datepicker-years"><table class="table-condensed">'+q.headTemplate+q.contTemplate+q.footTemplate+"</table></div></div>",a.fn.datepicker.DPGlobal=q,a.fn.datepicker.noConflict=function(){return a.fn.datepicker=l,this},a.fn.datepicker.version="1.4.1-dev",a(document).on("focus.datepicker.data-api click.datepicker.data-api",'[data-provide="datepicker"]',function(b){var c=a(this);c.data("datepicker")||(b.preventDefault(),m.call(c,"show"))}),a(function(){m.call(a('[data-provide="datepicker-inline"]'))})}(window.jQuery);
/**
 * French translation for bootstrap-datepicker
 * Nico Mollet <nico.mollet@gmail.com>
 */
;(function($){
	$.fn.datepicker.dates['fr'] = {
		days: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
		daysShort: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
		daysMin: ["d", "l", "ma", "me", "j", "v", "s"],
		months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
		monthsShort: ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
		today: "Aujourd'hui",
		clear: "Effacer",
		weekStart: 1,
		format: "dd/mm/yyyy"
	};
}(jQuery));

/**
 * Bootstrap Multiselect (https://github.com/davidstutz/bootstrap-multiselect)
 * 
 * Apache License, Version 2.0:
 * Copyright (c) 2012 - 2015 David Stutz
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a
 * copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 * 
 * BSD 3-Clause License:
 * Copyright (c) 2012 - 2015 David Stutz
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    - Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer.
 *    - Redistributions in binary form must reproduce the above copyright notice,
 *      this list of conditions and the following disclaimer in the documentation
 *      and/or other materials provided with the distribution.
 *    - Neither the name of David Stutz nor the names of its contributors may be
 *      used to endorse or promote products derived from this software without
 *      specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
!function ($) {
    "use strict";// jshint ;_;

    if (typeof ko !== 'undefined' && ko.bindingHandlers && !ko.bindingHandlers.multiselect) {
        ko.bindingHandlers.multiselect = {
            after: ['options', 'value', 'selectedOptions'],

            init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                var $element = $(element);
                var config = ko.toJS(valueAccessor());

                $element.multiselect(config);

                if (allBindings.has('options')) {
                    var options = allBindings.get('options');
                    if (ko.isObservable(options)) {
                        ko.computed({
                            read: function() {
                                options();
                                setTimeout(function() {
                                    var ms = $element.data('multiselect');
                                    if (ms)
                                        ms.updateOriginalOptions();//Not sure how beneficial this is.
                                    $element.multiselect('rebuild');
                                }, 1);
                            },
                            disposeWhenNodeIsRemoved: element
                        });
                    }
                }

                //value and selectedOptions are two-way, so these will be triggered even by our own actions.
                //It needs some way to tell if they are triggered because of us or because of outside change.
                //It doesn't loop but it's a waste of processing.
                if (allBindings.has('value')) {
                    var value = allBindings.get('value');
                    if (ko.isObservable(value)) {
                        ko.computed({
                            read: function() {
                                value();
                                setTimeout(function() {
                                    $element.multiselect('refresh');
                                }, 1);
                            },
                            disposeWhenNodeIsRemoved: element
                        }).extend({ rateLimit: 100, notifyWhenChangesStop: true });
                    }
                }

                //Switched from arrayChange subscription to general subscription using 'refresh'.
                //Not sure performance is any better using 'select' and 'deselect'.
                if (allBindings.has('selectedOptions')) {
                    var selectedOptions = allBindings.get('selectedOptions');
                    if (ko.isObservable(selectedOptions)) {
                        ko.computed({
                            read: function() {
                                selectedOptions();
                                setTimeout(function() {
                                    $element.multiselect('refresh');
                                }, 1);
                            },
                            disposeWhenNodeIsRemoved: element
                        }).extend({ rateLimit: 100, notifyWhenChangesStop: true });
                    }
                }

                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    $element.multiselect('destroy');
                });
            },

            update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                var $element = $(element);
                var config = ko.toJS(valueAccessor());

                $element.multiselect('setOptions', config);
                $element.multiselect('rebuild');
            }
        };
    }

    function forEach(array, callback) {
        for (var index = 0; index < array.length; ++index) {
            callback(array[index], index);
        }
    }

    /**
     * Constructor to create a new multiselect using the given select.
     *
     * @param {jQuery} select
     * @param {Object} options
     * @returns {Multiselect}
     */
    function Multiselect(select, options) {

        this.$select = $(select);
        
        // Placeholder via data attributes
        if (this.$select.attr("data-placeholder")) {
            options.nonSelectedText = this.$select.data("placeholder");
        }
        
        this.options = this.mergeOptions($.extend({}, options, this.$select.data()));

        // Initialization.
        // We have to clone to create a new reference.
        this.originalOptions = this.$select.clone()[0].options;
        this.query = '';
        this.searchTimeout = null;
        this.lastToggledInput = null

        this.options.multiple = this.$select.attr('multiple') === "multiple";
        this.options.onChange = $.proxy(this.options.onChange, this);
        this.options.onDropdownShow = $.proxy(this.options.onDropdownShow, this);
        this.options.onDropdownHide = $.proxy(this.options.onDropdownHide, this);
        this.options.onDropdownShown = $.proxy(this.options.onDropdownShown, this);
        this.options.onDropdownHidden = $.proxy(this.options.onDropdownHidden, this);
        
        // Build select all if enabled.
        this.buildContainer();
        this.buildButton();
        this.buildDropdown();
        this.buildSelectAll();
        this.buildDropdownOptions();
        this.buildFilter();

        this.updateButtonText();
        this.updateSelectAll();

        if (this.options.disableIfEmpty && $('option', this.$select).length <= 0) {
            this.disable();
        }
        
        this.$select.hide().after(this.$container);
    };

    Multiselect.prototype = {

        defaults: {
            /**
             * Default text function will either print 'None selected' in case no
             * option is selected or a list of the selected options up to a length
             * of 3 selected options.
             * 
             * @param {jQuery} options
             * @param {jQuery} select
             * @returns {String}
             */
            buttonText: function(options, select) {
                if (options.length === 0) {
                    return this.nonSelectedText;
                }
                else if (this.allSelectedText 
                            && options.length === $('option', $(select)).length 
                            && $('option', $(select)).length !== 1 
                            && this.multiple) {

                    if (this.selectAllNumber) {
                        return this.allSelectedText + ' (' + options.length + ')';
                    }
                    else {
                        return this.allSelectedText;
                    }
                }
                else if (options.length > this.numberDisplayed) {
                    return options.length + ' ' + this.nSelectedText;
                }
                else {
                    var selected = '';
                    var delimiter = this.delimiterText;
                    
                    options.each(function() {
                        var label = ($(this).attr('label') !== undefined) ? $(this).attr('label') : $(this).text();
                        selected += label + delimiter;
                    });
                    
                    return selected.substr(0, selected.length - 2);
                }
            },
            /**
             * Updates the title of the button similar to the buttonText function.
             * 
             * @param {jQuery} options
             * @param {jQuery} select
             * @returns {@exp;selected@call;substr}
             */
            buttonTitle: function(options, select) {
                if (options.length === 0) {
                    return this.nonSelectedText;
                }
                else {
                    var selected = '';
                    var delimiter = this.delimiterText;
                    
                    options.each(function () {
                        var label = ($(this).attr('label') !== undefined) ? $(this).attr('label') : $(this).text();
                        selected += label + delimiter;
                    });
                    return selected.substr(0, selected.length - 2);
                }
            },
            /**
             * Create a label.
             *
             * @param {jQuery} element
             * @returns {String}
             */
            optionLabel: function(element){
                return $(element).attr('label') || $(element).text();
            },
            /**
             * Triggered on change of the multiselect.
             * 
             * Not triggered when selecting/deselecting options manually.
             * 
             * @param {jQuery} option
             * @param {Boolean} checked
             */
            onChange : function(option, checked) {

            },
            /**
             * Triggered when the dropdown is shown.
             *
             * @param {jQuery} event
             */
            onDropdownShow: function(event) {

            },
            /**
             * Triggered when the dropdown is hidden.
             *
             * @param {jQuery} event
             */
            onDropdownHide: function(event) {

            },
            /**
             * Triggered after the dropdown is shown.
             * 
             * @param {jQuery} event
             */
            onDropdownShown: function(event) {
                
            },
            /**
             * Triggered after the dropdown is hidden.
             * 
             * @param {jQuery} event
             */
            onDropdownHidden: function(event) {
                
            },
            /**
             * Triggered on select all.
             */
            onSelectAll: function() {
                
            },
            enableHTML: false,
            buttonClass: 'btn btn-default',
            inheritClass: false,
            buttonWidth: 'auto',
            buttonContainer: '<div class="btn-group" />',
            dropRight: false,
            selectedClass: 'active',
            // Maximum height of the dropdown menu.
            // If maximum height is exceeded a scrollbar will be displayed.
            maxHeight: false,
            checkboxName: false,
            includeSelectAllOption: false,
            includeSelectAllIfMoreThan: 0,
            selectAllText: ' Select all',
            selectAllValue: 'multiselect-all',
            selectAllName: false,
            selectAllNumber: true,
            enableFiltering: false,
            enableCaseInsensitiveFiltering: false,
            enableClickableOptGroups: false,
            filterPlaceholder: 'Search',
            // possible options: 'text', 'value', 'both'
            filterBehavior: 'text',
            includeFilterClearBtn: true,
            preventInputChangeEvent: false,
            nonSelectedText: 'None selected',
            nSelectedText: 'selected',
            allSelectedText: 'All selected',
            numberDisplayed: 3,
            disableIfEmpty: false,
            delimiterText: ', ',
            templates: {
                button: '<button type="button" class="multiselect dropdown-toggle" data-toggle="dropdown"><span class="multiselect-selected-text"></span> <b class="caret"></b></button>',
                ul: '<ul class="multiselect-container dropdown-menu"></ul>',
                filter: '<li class="multiselect-item filter"><div class="input-group"><span class="input-group-addon"><i class="glyphicon glyphicon-search"></i></span><input class="form-control multiselect-search" type="text"></div></li>',
                filterClearBtn: '<span class="input-group-btn"><button class="btn btn-default multiselect-clear-filter" type="button"><i class="glyphicon glyphicon-remove-circle"></i></button></span>',
                li: '<li><a tabindex="0"><label></label></a></li>',
                divider: '<li class="multiselect-item divider"></li>',
                liGroup: '<li class="multiselect-item multiselect-group"><label></label></li>'
            }
        },

        constructor: Multiselect,

        /**
         * Builds the container of the multiselect.
         */
        buildContainer: function() {
            this.$container = $(this.options.buttonContainer);
            this.$container.on('show.bs.dropdown', this.options.onDropdownShow);
            this.$container.on('hide.bs.dropdown', this.options.onDropdownHide);
            this.$container.on('shown.bs.dropdown', this.options.onDropdownShown);
            this.$container.on('hidden.bs.dropdown', this.options.onDropdownHidden);
        },

        /**
         * Builds the button of the multiselect.
         */
        buildButton: function() {
            this.$button = $(this.options.templates.button).addClass(this.options.buttonClass);
            if (this.$select.attr('class') && this.options.inheritClass) {
                this.$button.addClass(this.$select.attr('class'));
            }
            // Adopt active state.
            if (this.$select.prop('disabled')) {
                this.disable();
            }
            else {
                this.enable();
            }

            // Manually add button width if set.
            if (this.options.buttonWidth && this.options.buttonWidth !== 'auto') {
                this.$button.css({
                    'width' : this.options.buttonWidth,
                    'overflow' : 'hidden',
                    'text-overflow' : 'ellipsis'
                });
                this.$container.css({
                    'width': this.options.buttonWidth
                });
            }

            // Keep the tab index from the select.
            var tabindex = this.$select.attr('tabindex');
            if (tabindex) {
                this.$button.attr('tabindex', tabindex);
            }

            this.$container.prepend(this.$button);
        },

        /**
         * Builds the ul representing the dropdown menu.
         */
        buildDropdown: function() {

            // Build ul.
            this.$ul = $(this.options.templates.ul);

            if (this.options.dropRight) {
                this.$ul.addClass('pull-right');
            }

            // Set max height of dropdown menu to activate auto scrollbar.
            if (this.options.maxHeight) {
                // TODO: Add a class for this option to move the css declarations.
                this.$ul.css({
                    'max-height': this.options.maxHeight + 'px',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden'
                });
            }

            this.$container.append(this.$ul);
        },

        /**
         * Build the dropdown options and binds all nessecary events.
         * 
         * Uses createDivider and createOptionValue to create the necessary options.
         */
        buildDropdownOptions: function() {

            this.$select.children().each($.proxy(function(index, element) {

                var $element = $(element);
                // Support optgroups and options without a group simultaneously.
                var tag = $element.prop('tagName')
                    .toLowerCase();
            
                if ($element.prop('value') === this.options.selectAllValue) {
                    return;
                }

                if (tag === 'optgroup') {
                    this.createOptgroup(element);
                }
                else if (tag === 'option') {

                    if ($element.data('role') === 'divider') {
                        this.createDivider();
                    }
                    else {
                        this.createOptionValue(element);
                    }

                }

                // Other illegal tags will be ignored.
            }, this));

            // Bind the change event on the dropdown elements.
            $('li input', this.$ul).on('change', $.proxy(function(event) {
                var $target = $(event.target);

                var checked = $target.prop('checked') || false;
                var isSelectAllOption = $target.val() === this.options.selectAllValue;

                // Apply or unapply the configured selected class.
                if (this.options.selectedClass) {
                    if (checked) {
                        $target.closest('li')
                            .addClass(this.options.selectedClass);
                    }
                    else {
                        $target.closest('li')
                            .removeClass(this.options.selectedClass);
                    }
                }

                // Get the corresponding option.
                var value = $target.val();
                var $option = this.getOptionByValue(value);

                var $optionsNotThis = $('option', this.$select).not($option);
                var $checkboxesNotThis = $('input', this.$container).not($target);

                if (isSelectAllOption) {
                    if (checked) {
                        this.selectAll();
                    }
                    else {
                        this.deselectAll();
                    }
                }

                if(!isSelectAllOption){
                    if (checked) {
                        $option.prop('selected', true);

                        if (this.options.multiple) {
                            // Simply select additional option.
                            $option.prop('selected', true);
                        }
                        else {
                            // Unselect all other options and corresponding checkboxes.
                            if (this.options.selectedClass) {
                                $($checkboxesNotThis).closest('li').removeClass(this.options.selectedClass);
                            }

                            $($checkboxesNotThis).prop('checked', false);
                            $optionsNotThis.prop('selected', false);

                            // It's a single selection, so close.
                            this.$button.click();
                        }

                        if (this.options.selectedClass === "active") {
                            $optionsNotThis.closest("a").css("outline", "");
                        }
                    }
                    else {
                        // Unselect option.
                        $option.prop('selected', false);
                    }
                }

                this.$select.change();

                this.updateButtonText();
                this.updateSelectAll();

                this.options.onChange($option, checked);

                if(this.options.preventInputChangeEvent) {
                    return false;
                }
            }, this));

            $('li a', this.$ul).on('mousedown', function(e) {
                if (e.shiftKey) {
                    // Prevent selecting text by Shift+click
                    return false;
                }
            });
        
            $('li a', this.$ul).on('touchstart click', $.proxy(function(event) {
                event.stopPropagation();

                var $target = $(event.target);
                
                if (event.shiftKey && this.options.multiple) {
                    if($target.is("label")){ // Handles checkbox selection manually (see https://github.com/davidstutz/bootstrap-multiselect/issues/431)
                        event.preventDefault();
                        $target = $target.find("input");
                        $target.prop("checked", !$target.prop("checked"));
                    }
                    var checked = $target.prop('checked') || false;

                    if (this.lastToggledInput !== null && this.lastToggledInput !== $target) { // Make sure we actually have a range
                        var from = $target.closest("li").index();
                        var to = this.lastToggledInput.closest("li").index();
                        
                        if (from > to) { // Swap the indices
                            var tmp = to;
                            to = from;
                            from = tmp;
                        }
                        
                        // Make sure we grab all elements since slice excludes the last index
                        ++to;
                        
                        // Change the checkboxes and underlying options
                        var range = this.$ul.find("li").slice(from, to).find("input");
                        
                        range.prop('checked', checked);
                        
                        if (this.options.selectedClass) {
                            range.closest('li')
                                .toggleClass(this.options.selectedClass, checked);
                        }
                        
                        for (var i = 0, j = range.length; i < j; i++) {
                            var $checkbox = $(range[i]);

                            var $option = this.getOptionByValue($checkbox.val());

                            $option.prop('selected', checked);
                        }                   
                    }
                    
                    // Trigger the select "change" event
                    $target.trigger("change");
                }
                
                // Remembers last clicked option
                if($target.is("input") && !$target.closest("li").is(".multiselect-item")){
                    this.lastToggledInput = $target;
                }

                $target.blur();
            }, this));

            // Keyboard support.
            this.$container.off('keydown.multiselect').on('keydown.multiselect', $.proxy(function(event) {
                if ($('input[type="text"]', this.$container).is(':focus')) {
                    return;
                }

                if (event.keyCode === 9 && this.$container.hasClass('open')) {
                    this.$button.click();
                }
                else {
                    var $items = $(this.$container).find("li:not(.divider):not(.disabled) a").filter(":visible");

                    if (!$items.length) {
                        return;
                    }

                    var index = $items.index($items.filter(':focus'));

                    // Navigation up.
                    if (event.keyCode === 38 && index > 0) {
                        index--;
                    }
                    // Navigate down.
                    else if (event.keyCode === 40 && index < $items.length - 1) {
                        index++;
                    }
                    else if (!~index) {
                        index = 0;
                    }

                    var $current = $items.eq(index);
                    $current.focus();

                    if (event.keyCode === 32 || event.keyCode === 13) {
                        var $checkbox = $current.find('input');

                        $checkbox.prop("checked", !$checkbox.prop("checked"));
                        $checkbox.change();
                    }

                    event.stopPropagation();
                    event.preventDefault();
                }
            }, this));

            if(this.options.enableClickableOptGroups && this.options.multiple) {
                $('li.multiselect-group', this.$ul).on('click', $.proxy(function(event) {
                    event.stopPropagation();

                    var group = $(event.target).parent();

                    // Search all option in optgroup
                    var $options = group.nextUntil('li.multiselect-group');
                    var $visibleOptions = $options.filter(":visible:not(.disabled)");

                    // check or uncheck items
                    var allChecked = true;
                    var optionInputs = $visibleOptions.find('input');
                    optionInputs.each(function() {
                        allChecked = allChecked && $(this).prop('checked');
                    });

                    optionInputs.prop('checked', !allChecked).trigger('change');
               }, this));
            }
        },

        /**
         * Create an option using the given select option.
         *
         * @param {jQuery} element
         */
        createOptionValue: function(element) {
            var $element = $(element);
            if ($element.is(':selected')) {
                $element.prop('selected', true);
            }

            // Support the label attribute on options.
            var label = this.options.optionLabel(element);
            var value = $element.val();
            var inputType = this.options.multiple ? "checkbox" : "radio";

            var $li = $(this.options.templates.li);
            var $label = $('label', $li);
            $label.addClass(inputType);

            if (this.options.enableHTML) {
                $label.html(" " + label);
            }
            else {
                $label.text(" " + label);
            }
        
            var $checkbox = $('<input/>').attr('type', inputType);

            if (this.options.checkboxName) {
                $checkbox.attr('name', this.options.checkboxName);
            }
            $label.prepend($checkbox);

            var selected = $element.prop('selected') || false;
            $checkbox.val(value);

            if (value === this.options.selectAllValue) {
                $li.addClass("multiselect-item multiselect-all");
                $checkbox.parent().parent()
                    .addClass('multiselect-all');
            }

            $label.attr('title', $element.attr('title'));

            this.$ul.append($li);

            if ($element.is(':disabled')) {
                $checkbox.attr('disabled', 'disabled')
                    .prop('disabled', true)
                    .closest('a')
                    .attr("tabindex", "-1")
                    .closest('li')
                    .addClass('disabled');
            }

            $checkbox.prop('checked', selected);

            if (selected && this.options.selectedClass) {
                $checkbox.closest('li')
                    .addClass(this.options.selectedClass);
            }
        },

        /**
         * Creates a divider using the given select option.
         *
         * @param {jQuery} element
         */
        createDivider: function(element) {
            var $divider = $(this.options.templates.divider);
            this.$ul.append($divider);
        },

        /**
         * Creates an optgroup.
         *
         * @param {jQuery} group
         */
        createOptgroup: function(group) {
            var groupName = $(group).prop('label');

            // Add a header for the group.
            var $li = $(this.options.templates.liGroup);
            
            if (this.options.enableHTML) {
                $('label', $li).html(groupName);
            }
            else {
                $('label', $li).text(groupName);
            }
            
            if (this.options.enableClickableOptGroups) {
                $li.addClass('multiselect-group-clickable');
            }

            this.$ul.append($li);

            if ($(group).is(':disabled')) {
                $li.addClass('disabled');
            }

            // Add the options of the group.
            $('option', group).each($.proxy(function(index, element) {
                this.createOptionValue(element);
            }, this));
        },

        /**
         * Build the selct all.
         * 
         * Checks if a select all has already been created.
         */
        buildSelectAll: function() {
            if (typeof this.options.selectAllValue === 'number') {
                this.options.selectAllValue = this.options.selectAllValue.toString();
            }
            
            var alreadyHasSelectAll = this.hasSelectAll();

            if (!alreadyHasSelectAll && this.options.includeSelectAllOption && this.options.multiple
                    && $('option', this.$select).length > this.options.includeSelectAllIfMoreThan) {

                // Check whether to add a divider after the select all.
                if (this.options.includeSelectAllDivider) {
                    this.$ul.prepend($(this.options.templates.divider));
                }

                var $li = $(this.options.templates.li);
                $('label', $li).addClass("checkbox");
                
                if (this.options.enableHTML) {
                    $('label', $li).html(" " + this.options.selectAllText);
                }
                else {
                    $('label', $li).text(" " + this.options.selectAllText);
                }
                
                if (this.options.selectAllName) {
                    $('label', $li).prepend('<input type="checkbox" name="' + this.options.selectAllName + '" />');
                }
                else {
                    $('label', $li).prepend('<input type="checkbox" />');
                }
                
                var $checkbox = $('input', $li);
                $checkbox.val(this.options.selectAllValue);

                $li.addClass("multiselect-item multiselect-all");
                $checkbox.parent().parent()
                    .addClass('multiselect-all');

                this.$ul.prepend($li);

                $checkbox.prop('checked', false);
            }
        },

        /**
         * Builds the filter.
         */
        buildFilter: function() {

            // Build filter if filtering OR case insensitive filtering is enabled and the number of options exceeds (or equals) enableFilterLength.
            if (this.options.enableFiltering || this.options.enableCaseInsensitiveFiltering) {
                var enableFilterLength = Math.max(this.options.enableFiltering, this.options.enableCaseInsensitiveFiltering);

                if (this.$select.find('option').length >= enableFilterLength) {

                    this.$filter = $(this.options.templates.filter);
                    $('input', this.$filter).attr('placeholder', this.options.filterPlaceholder);
                    
                    // Adds optional filter clear button
                    if(this.options.includeFilterClearBtn){
                        var clearBtn = $(this.options.templates.filterClearBtn);
                        clearBtn.on('click', $.proxy(function(event){
                            clearTimeout(this.searchTimeout);
                            this.$filter.find('.multiselect-search').val('');
                            $('li', this.$ul).show().removeClass("filter-hidden");
                            this.updateSelectAll();
                        }, this));
                        this.$filter.find('.input-group').append(clearBtn);
                    }
                    
                    this.$ul.prepend(this.$filter);

                    this.$filter.val(this.query).on('click', function(event) {
                        event.stopPropagation();
                    }).on('input keydown', $.proxy(function(event) {
                        // Cancel enter key default behaviour
                        if (event.which === 13) {
                          event.preventDefault();
                        }
                        
                        // This is useful to catch "keydown" events after the browser has updated the control.
                        clearTimeout(this.searchTimeout);

                        this.searchTimeout = this.asyncFunction($.proxy(function() {

                            if (this.query !== event.target.value) {
                                this.query = event.target.value;

                                var currentGroup, currentGroupVisible;
                                $.each($('li', this.$ul), $.proxy(function(index, element) {
                                    var value = $('input', element).length > 0 ? $('input', element).val() : "";
                                    var text = $('label', element).text();

                                    var filterCandidate = '';
                                    if ((this.options.filterBehavior === 'text')) {
                                        filterCandidate = text;
                                    }
                                    else if ((this.options.filterBehavior === 'value')) {
                                        filterCandidate = value;
                                    }
                                    else if (this.options.filterBehavior === 'both') {
                                        filterCandidate = text + '\n' + value;
                                    }

                                    if (value !== this.options.selectAllValue && text) {
                                        // By default lets assume that element is not
                                        // interesting for this search.
                                        var showElement = false;

                                        if (this.options.enableCaseInsensitiveFiltering && filterCandidate.toLowerCase().indexOf(this.query.toLowerCase()) > -1) {
                                            showElement = true;
                                        }
                                        else if (filterCandidate.indexOf(this.query) > -1) {
                                            showElement = true;
                                        }

                                        // Toggle current element (group or group item) according to showElement boolean.
                                        $(element).toggle(showElement).toggleClass('filter-hidden', !showElement);
                                        
                                        // Differentiate groups and group items.
                                        if ($(element).hasClass('multiselect-group')) {
                                            // Remember group status.
                                            currentGroup = element;
                                            currentGroupVisible = showElement;
                                        }
                                        else {
                                            // Show group name when at least one of its items is visible.
                                            if (showElement) {
                                                $(currentGroup).show().removeClass('filter-hidden');
                                            }
                                            
                                            // Show all group items when group name satisfies filter.
                                            if (!showElement && currentGroupVisible) {
                                                $(element).show().removeClass('filter-hidden');
                                            }
                                        }
                                    }
                                }, this));
                            }

                            this.updateSelectAll();
                        }, this), 300, this);
                    }, this));
                }
            }
        },

        /**
         * Unbinds the whole plugin.
         */
        destroy: function() {
            this.$container.remove();
            this.$select.show();
            this.$select.data('multiselect', null);
        },

        /**
         * Refreshs the multiselect based on the selected options of the select.
         */
        refresh: function() {
            $('option', this.$select).each($.proxy(function(index, element) {
                var $input = $('li input', this.$ul).filter(function() {
                    return $(this).val() === $(element).val();
                });

                if ($(element).is(':selected')) {
                    $input.prop('checked', true);

                    if (this.options.selectedClass) {
                        $input.closest('li')
                            .addClass(this.options.selectedClass);
                    }
                }
                else {
                    $input.prop('checked', false);

                    if (this.options.selectedClass) {
                        $input.closest('li')
                            .removeClass(this.options.selectedClass);
                    }
                }

                if ($(element).is(":disabled")) {
                    $input.attr('disabled', 'disabled')
                        .prop('disabled', true)
                        .closest('li')
                        .addClass('disabled');
                }
                else {
                    $input.prop('disabled', false)
                        .closest('li')
                        .removeClass('disabled');
                }
            }, this));

            this.updateButtonText();
            this.updateSelectAll();
        },

        /**
         * Select all options of the given values.
         * 
         * If triggerOnChange is set to true, the on change event is triggered if
         * and only if one value is passed.
         * 
         * @param {Array} selectValues
         * @param {Boolean} triggerOnChange
         */
        select: function(selectValues, triggerOnChange) {
            if(!$.isArray(selectValues)) {
                selectValues = [selectValues];
            }

            for (var i = 0; i < selectValues.length; i++) {
                var value = selectValues[i];

                if (value === null || value === undefined) {
                    continue;
                }

                var $option = this.getOptionByValue(value);
                var $checkbox = this.getInputByValue(value);

                if($option === undefined || $checkbox === undefined) {
                    continue;
                }
                
                if (!this.options.multiple) {
                    this.deselectAll(false);
                }
                
                if (this.options.selectedClass) {
                    $checkbox.closest('li')
                        .addClass(this.options.selectedClass);
                }

                $checkbox.prop('checked', true);
                $option.prop('selected', true);
                
                if (triggerOnChange) {
                    this.options.onChange($option, true);
                }
            }

            this.updateButtonText();
            this.updateSelectAll();
        },

        /**
         * Clears all selected items.
         */
        clearSelection: function () {
            this.deselectAll(false);
            this.updateButtonText();
            this.updateSelectAll();
        },

        /**
         * Deselects all options of the given values.
         * 
         * If triggerOnChange is set to true, the on change event is triggered, if
         * and only if one value is passed.
         * 
         * @param {Array} deselectValues
         * @param {Boolean} triggerOnChange
         */
        deselect: function(deselectValues, triggerOnChange) {
            if(!$.isArray(deselectValues)) {
                deselectValues = [deselectValues];
            }

            for (var i = 0; i < deselectValues.length; i++) {
                var value = deselectValues[i];

                if (value === null || value === undefined) {
                    continue;
                }

                var $option = this.getOptionByValue(value);
                var $checkbox = this.getInputByValue(value);

                if($option === undefined || $checkbox === undefined) {
                    continue;
                }

                if (this.options.selectedClass) {
                    $checkbox.closest('li')
                        .removeClass(this.options.selectedClass);
                }

                $checkbox.prop('checked', false);
                $option.prop('selected', false);
                
                if (triggerOnChange) {
                    this.options.onChange($option, false);
                }
            }

            this.updateButtonText();
            this.updateSelectAll();
        },
        
        /**
         * Selects all enabled & visible options.
         *
         * If justVisible is true or not specified, only visible options are selected.
         *
         * @param {Boolean} justVisible
         * @param {Boolean} triggerOnSelectAll
         */
        selectAll: function (justVisible, triggerOnSelectAll) {
            var justVisible = typeof justVisible === 'undefined' ? true : justVisible;
            var allCheckboxes = $("li input[type='checkbox']:enabled", this.$ul);
            var visibleCheckboxes = allCheckboxes.filter(":visible");
            var allCheckboxesCount = allCheckboxes.length;
            var visibleCheckboxesCount = visibleCheckboxes.length;
            
            if(justVisible) {
                visibleCheckboxes.prop('checked', true);
                $("li:not(.divider):not(.disabled)", this.$ul).filter(":visible").addClass(this.options.selectedClass);
            }
            else {
                allCheckboxes.prop('checked', true);
                $("li:not(.divider):not(.disabled)", this.$ul).addClass(this.options.selectedClass);
            }
                
            if (allCheckboxesCount === visibleCheckboxesCount || justVisible === false) {
                $("option:enabled", this.$select).prop('selected', true);
            }
            else {
                var values = visibleCheckboxes.map(function() {
                    return $(this).val();
                }).get();
                
                $("option:enabled", this.$select).filter(function(index) {
                    return $.inArray($(this).val(), values) !== -1;
                }).prop('selected', true);
            }
            
            if (triggerOnSelectAll) {
                this.options.onSelectAll();
            }
        },

        /**
         * Deselects all options.
         * 
         * If justVisible is true or not specified, only visible options are deselected.
         * 
         * @param {Boolean} justVisible
         */
        deselectAll: function (justVisible) {
            var justVisible = typeof justVisible === 'undefined' ? true : justVisible;
            
            if(justVisible) {              
                var visibleCheckboxes = $("li input[type='checkbox']:not(:disabled)", this.$ul).filter(":visible");
                visibleCheckboxes.prop('checked', false);
                
                var values = visibleCheckboxes.map(function() {
                    return $(this).val();
                }).get();
                
                $("option:enabled", this.$select).filter(function(index) {
                    return $.inArray($(this).val(), values) !== -1;
                }).prop('selected', false);
                
                if (this.options.selectedClass) {
                    $("li:not(.divider):not(.disabled)", this.$ul).filter(":visible").removeClass(this.options.selectedClass);
                }
            }
            else {
                $("li input[type='checkbox']:enabled", this.$ul).prop('checked', false);
                $("option:enabled", this.$select).prop('selected', false);
                
                if (this.options.selectedClass) {
                    $("li:not(.divider):not(.disabled)", this.$ul).removeClass(this.options.selectedClass);
                }
            }
        },

        /**
         * Rebuild the plugin.
         * 
         * Rebuilds the dropdown, the filter and the select all option.
         */
        rebuild: function() {
            this.$ul.html('');

            // Important to distinguish between radios and checkboxes.
            this.options.multiple = this.$select.attr('multiple') === "multiple";

            this.buildSelectAll();
            this.buildDropdownOptions();
            this.buildFilter();

            this.updateButtonText();
            this.updateSelectAll();
            
            if (this.options.disableIfEmpty && $('option', this.$select).length <= 0) {
                this.disable();
            }
            else {
                this.enable();
            }
            
            if (this.options.dropRight) {
                this.$ul.addClass('pull-right');
            }
        },

        /**
         * The provided data will be used to build the dropdown.
         */
        dataprovider: function(dataprovider) {
            
            var groupCounter = 0;
            var $select = this.$select.empty();
            
            $.each(dataprovider, function (index, option) {
                var $tag;
                
                if ($.isArray(option.children)) { // create optiongroup tag
                    groupCounter++;
                    
                    $tag = $('<optgroup/>').attr({
                        label: option.label || 'Group ' + groupCounter,
                        disabled: !!option.disabled
                    });
                    
                    forEach(option.children, function(subOption) { // add children option tags
                        $tag.append($('<option/>').attr({
                            value: subOption.value,
                            label: subOption.label || subOption.value,
                            title: subOption.title,
                            selected: !!subOption.selected,
                            disabled: !!subOption.disabled
                        }));
                    });
                }
                else {
                    $tag = $('<option/>').attr({
                        value: option.value,
                        label: option.label || option.value,
                        title: option.title,
                        selected: !!option.selected,
                        disabled: !!option.disabled
                    });
                }
                
                $select.append($tag);
            });
            
            this.rebuild();
        },

        /**
         * Enable the multiselect.
         */
        enable: function() {
            this.$select.prop('disabled', false);
            this.$button.prop('disabled', false)
                .removeClass('disabled');
        },

        /**
         * Disable the multiselect.
         */
        disable: function() {
            this.$select.prop('disabled', true);
            this.$button.prop('disabled', true)
                .addClass('disabled');
        },

        /**
         * Set the options.
         *
         * @param {Array} options
         */
        setOptions: function(options) {
            this.options = this.mergeOptions(options);
        },

        /**
         * Merges the given options with the default options.
         *
         * @param {Array} options
         * @returns {Array}
         */
        mergeOptions: function(options) {
            return $.extend(true, {}, this.defaults, this.options, options);
        },

        /**
         * Checks whether a select all checkbox is present.
         *
         * @returns {Boolean}
         */
        hasSelectAll: function() {
            return $('li.multiselect-all', this.$ul).length > 0;
        },

        /**
         * Updates the select all checkbox based on the currently displayed and selected checkboxes.
         */
        updateSelectAll: function() {
            if (this.hasSelectAll()) {
                var allBoxes = $("li:not(.multiselect-item):not(.filter-hidden) input:enabled", this.$ul);
                var allBoxesLength = allBoxes.length;
                var checkedBoxesLength = allBoxes.filter(":checked").length;
                var selectAllLi  = $("li.multiselect-all", this.$ul);
                var selectAllInput = selectAllLi.find("input");
                
                if (checkedBoxesLength > 0 && checkedBoxesLength === allBoxesLength) {
                    selectAllInput.prop("checked", true);
                    selectAllLi.addClass(this.options.selectedClass);
                    this.options.onSelectAll();
                }
                else {
                    selectAllInput.prop("checked", false);
                    selectAllLi.removeClass(this.options.selectedClass);
                }
            }
        },

        /**
         * Update the button text and its title based on the currently selected options.
         */
        updateButtonText: function() {
            var options = this.getSelected();
            
            // First update the displayed button text.
            if (this.options.enableHTML) {
                $('.multiselect .multiselect-selected-text', this.$container).html(this.options.buttonText(options, this.$select));
            }
            else {
                $('.multiselect .multiselect-selected-text', this.$container).text(this.options.buttonText(options, this.$select));
            }
            
            // Now update the title attribute of the button.
            $('.multiselect', this.$container).attr('title', this.options.buttonTitle(options, this.$select));
        },

        /**
         * Get all selected options.
         *
         * @returns {jQUery}
         */
        getSelected: function() {
            return $('option', this.$select).filter(":selected");
        },

        /**
         * Gets a select option by its value.
         *
         * @param {String} value
         * @returns {jQuery}
         */
        getOptionByValue: function (value) {

            var options = $('option', this.$select);
            var valueToCompare = value.toString();

            for (var i = 0; i < options.length; i = i + 1) {
                var option = options[i];
                if (option.value === valueToCompare) {
                    return $(option);
                }
            }
        },

        /**
         * Get the input (radio/checkbox) by its value.
         *
         * @param {String} value
         * @returns {jQuery}
         */
        getInputByValue: function (value) {

            var checkboxes = $('li input', this.$ul);
            var valueToCompare = value.toString();

            for (var i = 0; i < checkboxes.length; i = i + 1) {
                var checkbox = checkboxes[i];
                if (checkbox.value === valueToCompare) {
                    return $(checkbox);
                }
            }
        },

        /**
         * Used for knockout integration.
         */
        updateOriginalOptions: function() {
            this.originalOptions = this.$select.clone()[0].options;
        },

        asyncFunction: function(callback, timeout, self) {
            var args = Array.prototype.slice.call(arguments, 3);
            return setTimeout(function() {
                callback.apply(self || window, args);
            }, timeout);
        },

        setAllSelectedText: function(allSelectedText) {
            this.options.allSelectedText = allSelectedText;
            this.updateButtonText();
        }
    };

    $.fn.multiselect = function(option, parameter, extraOptions) {
        return this.each(function() {
            var data = $(this).data('multiselect');
            var options = typeof option === 'object' && option;

            // Initialize the multiselect.
            if (!data) {
                data = new Multiselect(this, options);
                $(this).data('multiselect', data);
            }

            // Call multiselect method.
            if (typeof option === 'string') {
                data[option](parameter, extraOptions);
                
                if (option === 'destroy') {
                    $(this).data('multiselect', false);
                }
            }
        });
    };

    $.fn.multiselect.Constructor = Multiselect;

    $(function() {
        $("select[data-role=multiselect]").multiselect();
    });

}(window.jQuery);

jQuery.fn.rotate = function(degrees) 
{
    $(this).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
                 '-moz-transform' : 'rotate('+ degrees +'deg)',
                 '-ms-transform' : 'rotate('+ degrees +'deg)',
                 'transform' : 'rotate('+ degrees +'deg)'});
    return $(this);
};

$('.dropdown_menu').click(function(e)
{
    if(!$(this).parent().find('.dropdown_sous_menu').is(':hidden'))
    {
        $(this).parent().find('.dropdown_sous_menu').slideUp('fast');
        $(this).find('.glyphicon-menu-down').rotate(0);
    }
    else
    {
        $(this).parent().find('.dropdown_sous_menu').slideDown('fast');
        $(this).find('.glyphicon-menu-down').rotate(180);
    }

    return false;
});