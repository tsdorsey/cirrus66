// ==UserScript==
// @name         Cirrus66
// @namespace    https://github.com/tsdorsey/cirrus66
// @version      0.2.1
// @description  Organize the dashboard to be a bit more compact.
// @author       Trevor Dorsey
// @match        https://app.cloud66.com/dashboard
// @grant        none
// @require      https://code.jquery.com/jquery-2.1.4.js
// @require      https://code.jquery.com/ui/1.11.4/jquery-ui.js
// @run-at       document-idle
// ==/UserScript==

var MutationObserver    = window.MutationObserver || window.WebKitMutationObserver;

function waitForListLoad() {
  if($('#js_search_list').length > 0) {
    start();
  } else {
    setTimeout(waitForListLoad, 250);
  }
}
waitForListLoad();

function start() {
  var items = $('#js_search_list > li');
  var list = items.toArray();

  var envOrder = ['c66_develop', 'staging', 'production'];
  var stackOrder = ['Accounts', 'Dashboard', 'Greenhouse', 'API', 'Sites', 'CloverSites.com'];

  list.forEach(makeSingleColumn);
  bindUpdate(list);
  sortByEnvironment(list, envOrder, stackOrder, '40px');
}

function bindUpdate(itemList) {
  // create an observer instance
  var observer = new MutationObserver (mutationHandler);
  var config = { childList: true, subtree: true };

  itemList.forEach(function(item) {
    observer.observe(item, config);
    updateStack(item);
  });
}

function mutationHandler(mutationRecords) {
  mutationRecords.forEach(function(record) { 
    updateStack(record.target);
  });
}

function updateStack(item) {
  var $item = $(item);

  if($item.hasClass('cirrus--update')) { return; }

  $item.addClass('cirrus--update');
  compressSpace(item);
  hideFooter(item);
  environmentFirst(item);
  $item.removeClass('cirrus--update');
}

function makeSingleColumn(listItem) {
  var $item = $(listItem);
  $item.removeClass('desk--one-half');
}

function compressSpace(listItem) {
  var $item = $(listItem);
  $item.find('.Module-header').css( { 'padding-top': '4px', 'padding-bottom': '4px' } );
  $item.find('.Module-headerTools').css( { 'top': '2px' } );
  $item.find('.Module-body').css( { 'height': 'auto', 'padding-top': '0', 'padding-bottom': '3px' } );
  $item.find('.Module--cardList').css( { 'display': 'inline-block', 'margin-right': '50px' } );
  $item.find('.Module--cardListSub > li').css( { 'display': 'inline', 'margin-right': '20px' } );
  $item.find('.state-label').css( { 'position': 'relative', 'top': '7px' } );
  $item.find('.Module--cardScore').css( { 'position': 'relative', 'top': '7px' } );
}

function hideFooter(listItem) {
  var $item = $(listItem);
  $item.find('footer.Module-footer').css( { 'display': 'none' } );
}

function environmentFirst(listItem) {
  var $item = $(listItem);
  var $link = $item.find('.Module-titleLink');
  var $env = $link.find('.Module-titleSub');
  $env.detach();
  $link.prepend($env);
}

function sortByEnvironment(list, envOrder, stackOrder, endingPad) {
  list.sort(function(a, b) {
    var Da = envAndName(a);
    var Db = envAndName(b);

    var envOrderResult = order(Da.env, Db.env, envOrder);
    if(envOrderResult != 0) { return envOrderResult; }

    return order(Da.name, Db.name, stackOrder);
  });

  // Put them in the new order by detaching them and appending them in order.
  list.forEach(function(listItem) {
    var $item = $(listItem);
    $item.detach();
  });

  var parentContainer = $('#js_search_list');
  parentContainer.empty();

  var last = envAndName(list[0]);
  list.forEach(function(listItem) {
    var $item = $(listItem);
    parentContainer.append($item);
    parentContainer.append("<!--\n-->");

    var now = envAndName($item);
    if(now.env != last.env) {
      $item.css( { 'margin-top': endingPad } );
    }

    last = now;
  });
}

function order(a, b, list) {
  var A = list.indexOf(a);
  var B = list.indexOf(b);

  if(A == B) { 
    if(A == -1) {
      // If they are both missing from the list just compare the input values.
      if(a < b) { return -1; }
      if(a > b) { return 1; }
      if(a == b) { return 0; }
    } else {
      // Otherwise consider them equal.
      return 0; 
    }
  }

  // Items not in the list sort later than items found in the list.
  if(A == -1) { return 1; }
  if(B == -1) { return -1; }

  // Compare their position in the list.
  if(A < B) { return -1; }
  if(A > B) { return 1; }
}

function envAndName(item) {
  var $link = $(item).find('.Module-titleLink');
  var $env = $link.find('.Module-titleSub');
  var $stack = $link.find('.js-stack-name');
  return { 'name': $stack.html().trim(), 'env': $env.html().trim() };
}
