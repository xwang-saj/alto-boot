var TA_CONDITION = "TA";
var TR_CONDITION = "TR";
var LA_CONDITION = "LA";
var LR_CONDITION = "LR";
var numDocsToRunClassifier = 10; //number of labelingg until classifier runs
var numDocsPerPage = 10; //for label doc display

var labeledTopicsDocs = {};//topic to labeled suggested documents in that topic
var baselineLabeledDocs = [];
var topicdocs = {};
var topicWords = {};
var allBaselineDocs = [];
var baselineALDocs=[];
var topics;
var docs;
var all_docs;
var docToSummaryMap={};
var startSeconds = 0;

var top_docs = [];//for color change
var labelDocIds = {};//list of doc ids for all labels
var logStr = "";
var global_study_condition = "";

var logFileNum = 1;
var clickLabelTime;
var popUpWindow = null;
var mainWindow = null;
var docOpenTime;
//var labelOpenTime;
//load doc variables
var docid_wo_topicid;
var topicIndex;
var globalPosition;
var positionUnlabeled;
var requestTime;
var currLabel;
var labelDefiner;
var labelConfidence;
//load label docs variable
var clickLabelTime;
var displayedLabelIds=[];
var loadedLabelName;
var lastLabelTime;//the time since the label view loads or the last label change
var topicToAllDisplayedDocs = [];
var initialBaselineDocs = [];
var shuffledInitialBaselineDocs = [];
var usedLabels = [];
var newlyAddedLabel = false;//if a label existed, but no training data was in it, and now is added, set to true
var applyTime = 0; //label apply/approve/change time log

function get_doc(doc, documents){
	for (var d in documents){
		if (documents[d]["name"]==doc){
			return documents[d];
		}
	}
	return "";
}

function createDocItemTemplate (docId, url, docIdWTopic, topicIndex) {
	return `
		<div id="row_${docId}" class="mb-2 ellipsify">
				<a
					href='#'
					id="${docIdWTopic}"
					title="${mainWindow.docToSummaryMap[docId]}"
					onclick="load_doc('${url}', '${docIdWTopic}', '${topicIndex}', '1', null, false);return false;">
						${mainWindow.docToSummaryMap[docId]}
				</a>
		</div>`;
}

//Function adds row with topic content into table (including all data bindings to DOM elements)
function addTopic(topic, study_condition) {
	topic_top_docs = [];
	global_study_condition = study_condition;
	if (Object.keys(docIdToIndexMap).length == 0)
		fillDocToIndexMap();

	let topicindex = topic["topicindex"];
	labeledTopicsDocs[topicindex] = [];

	let wrds='';
	let words = topic['words'];
	let words_string = '';
	let count = 0;

	let size = 30;
	let largest = 40;
	wordCnt = 0;

	words.forEach((w) => {
		if (count == 0) {
			size = 20;
			largest = size / w.weight;
		} else {
			size = w.weight * largest;
		}
		if (size < 10) {
			size = 10;
		}

		wrds = `${wrds}<span style='font-size:${size}px'>${w.word}</span> `;

		words_string += w.word + "+";
		count += 1;
	});

	topicdocs[`${topicindex}`] = [];
	topicToALTopIds[`${topicindex}`] = [];
	topicToAllDisplayedDocs[`${topicindex}`] = [];

	//create shuffled doc index array
	words_string += ']';
	words_string = words_string.replace('+]', '');
	topicwords['' + topicindex] = words_string;

	let documents = topic["docs"];
	count = 0;
	let x = 0;
	for (var d in documents) {
		var lookup=get_doc(documents[d], docs);
		if (count < topic_doc_show_num) {
			url = backend + "/DisplayData";
			url = url+"?topic=" + words_string;
			var docid = "topic" + topicindex + "-" + lookup["name"];

			if(study_condition == TA_CONDITION || study_condition == TR_CONDITION){
				topicdocs[""+topicindex].push(lookup["name"]);
				topicToAllDisplayedDocs[""+topicindex].push(lookup["name"]);
				top_docs.push(docid);
				topic_top_docs.push(docid);
				numDisplayDocs = "1";
			}
			else{
				initialBaselineDocs.push(docid);
				top_docs.push(docid);
			}
		}
		count = count + 1;
	}

	if(study_condition == TA_CONDITION || study_condition == TR_CONDITION) {
		let html=`
		    <div id="topic-${topicindex}" class="document-container p-2">
		        <div id=topicRow-${topicindex} class="row align-items-start">
                <div id="topic-${topicindex}-words" class="col col-3 words">${wrds}</div>
		            <div id="topic-docs-${topicindex}" class="col col-9 documents">
		                <div id="summary-table-topic-${topicindex}>`

		topic_top_docs.forEach((docIdWTopic) => {
			let tmp = docIdWTopic.split('-');
			let topicindex = tmp.splice(0, 1);
			let docid_wo_topicid = '';

			tmp.forEach(i => docid_wo_topicid += i + '-');

			let id = docid_wo_topicid.substring(0 , docid_wo_topicid.length - 1);
			let summary = mainWindow.docToSummaryMap[id];
			html += createDocItemTemplate(id, url, docIdWTopic, topicindex);
		});
		html += `
                    </div>
                </div>
		        </div>
		    </div>`;

		$(html).appendTo("#mainform_items");
	}
	//attach topic data to tr element
	$(`#topic-${topicindex}`).data('topic', topic);
}
function followScroll() {
	for(var i = 0; i < topicsnum; i++) {
		$(`#topic-${i}-words`).fixTo(`#topic-${i}`, { top : 100 });
	}
}

//edited by yuening
function renderDocuments(json, study_condition) {
	//clear topics list
	$("#mainform_items").empty();
	//save vocabulary and documents to global variables
	docs = json.documents;
	all_docs = json.all_documents;
	topics = json.topics;

	if(Object.keys(docToSummaryMap).length == 0){
		fillDocToSummaryMap();
	}
	if(Object.keys(docToTopicMap).length == 0){
		fillDocTopics();
	}
	if (Object.keys(docIdToIndexMap).length == 0){
		fillDocToIndexMap();
	}

	for (var t in topics) {
		addTopic(topics[t], study_condition);
	}

	if(study_condition == LA_CONDITION || study_condition == LR_CONDITION){
		shuffledInitialBaselineDocs = json.shuffledDocs;
		displayBaselineDocs();
		document.getElementById("progress-bar-div").style.visibility = "hidden";
		document.getElementById("progress-header-div").style.visibility = "hidden";
	}
}
function displayBaselineDocs() {
	const url = `${backend}/DisplayData`;
	let baselineDocsStr = "";
	let htmlStr = '';

	for (let i in shuffledInitialBaselineDocs) {
		let docid_wo_topicid = shuffledInitialBaselineDocs[i];
		let docIdWTopic = mainWindow.getDocIdWithTopic(docid_wo_topicid);

		allBaselineDocs.push(docid_wo_topicid);
		baselineDocsStr += `${docid_wo_topicid},`;
		htmlStr += mainWindow.createDocItemTemplate(docid_wo_topicid, url, docIdWTopic, 0);
	}
	$(`
		<div id="summary-table">
			${htmlStr}
		</div>
	`).appendTo("#mainform_items")
}

function loadDefaultLabels(corpusname){
	const endpoint = `${backend}/${corpusname}/labels`;
	$.ajax({
		type: "GET",
		contentType: "application/x-www-form-urlencoded;charset=utf-8",
		url: endpoint,
		success: function(json) {
			if (json.hasError){
				window.alert("error");
				return;
			}
			setInterval(startTimer, 1000);
			setTimeout(() => {
			    console.log(json);
		        for (i=0; i<json.length; i++){
		            addLabelName(json[i]);
		        }
			}, 1000);
        }
    });
}

function loadUserLabels(corpusname) {
    const endpoint = `${backend}/${corpusname}/${sessionId}/labels?source=CREATED`;

    $.ajax({
        type: "GET",
        url: endpoint,
        success: function(json) {
            console.log(json);
            for (i=0; i<json.length; i++){
                addLabelName(json[i]);
            }
        }
    });
}

function loadDocLabels(corpusname) {
    const endpoint = `${backend}/${corpusname}/documents/${sessionId}/labels`;

    $.ajax({
        type: "GET",
        url: endpoint,
        success: function(json) {
            console.log(json);
            docLabelMap = json;
        }
    });
}

function loadInput(username, study_condition, loadDefaultLabels) {
	const endpoint = `${backend}/DataLoader?username=${username}`;
	//loading different conditions
	itm_done = false;

	// baseline
	if(study_condition === LA_CONDITION || study_condition === LR_CONDITION) {
		$('#themes-title').remove();
	}
	// SHOW overlay
	$('#loading').modal({
		keyboard: false
	})
	$('#loading_data').html("Loading data...");
	$('#loading').modal('show');
	$(".modal-backdrop").unbind();
	var output="";

	$.ajax({
		type: "POST",
		contentType: "application/x-www-form-urlencoded;charset=utf-8",
		url: endpoint,
		async: true,
		data: output,
		success: function(json) {
			if (json.hasError){
				window.alert("error");
				return;
			}
			setInterval(startTimer, 1000);
			setTimeout(() => {
        topicsnum = json.topicsnum;
        corpusname = json.corpusname;
        renderDocuments(json, study_condition);
        fillDocToIndexMap();
        $('#loading').modal('hide');
        startSeconds = Date.now() / 1000;
        addStartLogs(startSeconds, study_condition);
        if(mainWindow.global_study_condition == TA_CONDITION || mainWindow.global_study_condition == TR_CONDITION){
            followScroll();
        }
      }, 1000);
        loadDefaultLabels(json.corpusname);
        loadUserLabels(json.corpusname);
        loadDocLabels(json.corpusname);
		}
	});
}
//label view next
function load_next_label_docs(url, labelName, lastSeenIndex, numDocsPerPage){
	nextPrevClickTime = Date.now() / 1000;
	firstIndex = lastSeenIndex - numDocsPerPage+1;
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	mainWindow.logStr += "CLICKED NEXT LABEL VIEW:time="+nextPrevClickTime+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
	startIndex = Number(lastSeenIndex)+1;
	next_prev = true;
	url = window.location.href.split("/DisplayData")[0]+ url;
	mainWindow.load_label_docs(url, mainWindow, labelName, startIndex, numDocsPerPage, false);
}

//label view prev
function load_prev_label_docs(url, labelName, firstSeenIndex, numDocsPerPage){
	nextPrevClickTime = Date.now() / 1000;
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	next_prev = true;
	url = window.location.href.split("/DisplayData")[0]+ url;
	mainWindow.logStr += "CLICKED PREV LABEL VIEW:time="+nextPrevClickTime+",min="+currMin+",sec="+currSec+"%0A";
	mainWindow.takeLogsInServer();
	startIndex = Number(firstSeenIndex)-Number(numDocsPerPage);
	if(startIndex < 0){
		startIndex = 0;
	}
	mainWindow.load_label_docs(url, mainWindow, labelName, startIndex, numDocsPerPage, false);
}

function load_label_docs(url, newWindow, labelName, startIndex, numDocsPerPage, isRefreshed){
	mainWindow.loadedLabelName = labelName;
	clickLabelTime = Date.now() / 1000;

	if (newWindow == null) {
		mainWindow.takeLogsInServer();
		isLabelView = true;
		for(var i=0; i<Object.keys(mainWindow.localAllLabelDocMap).length; i++){
			var labelVal = Object.keys(mainWindow.localAllLabelDocMap)[i];
			mainWindow.localAllLabelDocMap[labelVal] = [];
			labelDocIds[labelVal] = [];
			for(var j in mainWindow.allLabelDocMap[labelVal]){
				var docId = mainWindow.allLabelDocMap[labelVal][j];
				labelDocIds[labelVal].push(docId);
				mainWindow.localAllLabelDocMap[labelVal].push(docId);
			}
		}
	}
	if (newWindow != null) { //in data page
		mainWindow.takeLogsInServer();
		mainWindow.isLabelView = true;
		docToTopicMap = mainWindow.docToTopicMap;
		AL = mainWindow.AL;
		localAllLabelDocMap = mainWindow.localAllLabelDocMap;
		labelDocIds = mainWindow.labelDocIds;
		labelSet = mainWindow.labelSet;
		classificationDocLabelMap = mainWindow.classificationDocLabelMap;
		docLabelProbMap = mainWindow.docLabelProbMap;
		docLabelMap = mainWindow.docLabelMap;
		corpusname = mainWindow.corpusname;
	}

	if (labelName in mainWindow.allLabelDocMap == false || mainWindow.allLabelDocMap[labelName].length == 0) {
		var appearTime = new Date().getTime() / 1000;
		window.alert("No documents to show!");
		var okTime = new Date().getTime() / 1000;
		var str = "No documents to show!"+labelName;
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
		return;
	}
	if (Object.keys(docIdToIndexMap).length == 0) {
		fillDocToIndexMap();
	}
	AL = false;
	var height = 600;
	var width = 600;
	var margin = 20;
	//url = url.split("/DisplayData2")[0]+"/DisplayData2?";

	//url = url.split("#")[0];
	url = backend + "/RelatedDocs?";
	docid = mainWindow.localAllLabelDocMap[labelName][Number(startIndex)];
	url += "labelName="+labelName;

    url += "&isRefreshed="+isRefreshed;
	url += "&docid="+docid;//first document with that label
	url +="&AL="+AL;
	url += "&corpusname="+ corpusname;
	url += "&numDisplayDocs="+mainWindow.localAllLabelDocMap[labelName].length;
	url += "&newWindow=" + (newWindow == "null");
	url += "&labelSet=";//Sends the label set as a parameter in url
	for (var key in labelSet) {
		url += key + ",";
	}
	url = url.substring(0,url.length-1);
	endIndex = Number(startIndex) + Number(numDocsPerPage) - 1;
	if(endIndex > mainWindow.localAllLabelDocMap[labelName].length-1)
		endIndex = mainWindow.localAllLabelDocMap[labelName].length-1;
	url += "&startIndex="+startIndex;
	url += "&endIndex="+endIndex;
	url += "&numDocsPerPage="+numDocsPerPage;
	//sending classification label results in url
	url+="&classificationDocLabelMap=";
	displayedLabelIds = [];
	for (i = startIndex; i <= endIndex; i++){
		currDocId = mainWindow.localAllLabelDocMap[labelName][i];
		displayedLabelIds.push(currDocId);
		if (mainWindow.classificationDocLabelMap[currDocId+""] != undefined && currDocId+"" in docLabelMap == false){
			url += currDocId + ":" + mainWindow.classificationDocLabelMap[currDocId+""]+",";
		}
	}
	url = url.substring(0,url.length-1);

	//sending in label probs in url
	url += "&docLabelProbMap=";
	for (i = startIndex; i <= endIndex; i++){
		currDocId = mainWindow.localAllLabelDocMap[labelName][i];
		if (docLabelProbMap[currDocId+""] != undefined){
			url += currDocId + ":";
			labelProbs = docLabelProbMap[currDocId+""];
			for(label in labelProbs){
				url += label + ";" + labelProbs[label] + "-";
			}
			url = url.substring(0,url.length-1);
			url += ",";
		}
	}
	url = url.substring(0,url.length-1);

	//sending docToLabel Map as a parameter in url
	url+="&docLabelMap=";
	for (i = startIndex; i <= endIndex; i++){
		currDocId = localAllLabelDocMap[labelName][i];
		if (docLabelMap[currDocId+""] != undefined){
			url += currDocId + ":" + docLabelMap[currDocId+""]+",";
		}
	}
	url = url.substring(0,url.length-1);
	url += "&isLabelDocs="+"true";

	url += "&labelDocIds=";
	for (i = startIndex; i <= endIndex; i++){
		url += labelDocIds[labelName][i]+",";
	}
	url = url.substring(0,url.length-1);

	var top = margin;
	var left = screen.width - width - margin;

	if (mainWindow.popUpWindow != null){
		mainWindow.popUpWindow.close();
	}

	newWindow = mainWindow.open(url, "Doc display", "status=1" + ", scrollbars=1" +
			", height=" + height +
			", width=" + width +
			", top=" + 20 +
			", left=" + left);

	newWindow.focus();
	mainWindow.popUpWindow = newWindow;
	$(newWindow).on("beforeunload", function(){
		var closeTime = new Date().getTime() / 1000;
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		addCloseLabelViewLogs(closeTime, labelName, currMin, currSec);
	});
}
function update_location(newWindow, url){
	newWindow.location.replace(url);
}


function load_doc(url, docid, topicid, numDisplayDocs, newWindow) {

	//mainWindow.isSuggestDocs = isSuggestDocs;
	mainWindow.isLabelView = false;
	//savedSuggestDocs = false;
	mainWindow.requestTime = new Date().getTime() / 1000;
	if (Object.keys(docIdToIndexMap).length == 0){
		fillDocToIndexMap();
	}
	doc_clicked = true;
	var height = 600;
	var width = 600;
	var margin = 20;
	tmp = docid.split("-");
	tmp.splice(0,1);
	mainWindow.docid_wo_topicid = "";
	for(i in tmp){
		mainWindow.docid_wo_topicid += tmp[i]+"-";
	}
	mainWindow.docid_wo_topicid = mainWindow.docid_wo_topicid.substring(0 , mainWindow.docid_wo_topicid.length-1);

	url = url.split("/DisplayData")[0]+"/DisplayData?";
	url += "docid="+docid_wo_topicid;
	url +="&AL="+AL;
	url += "&corpusname="+ corpusname;
	url += "&numDisplayDocs="+ numDisplayDocs;
	url += "&newWindow=" + (newWindow == null);
	url += "&labelSet=";//Sends the label set as a parameter in url

	for (var key in mainWindow.labelSet) {
		url += key + ",";
	}
	url = url.substring(0,url.length-1);
	idIndex = docIdToIndexMap[docid_wo_topicid];
	startIndex = idIndex;
	endIndex = idIndex;

	//sending classification label results in url
	url+="&classificationDocLabelMap=";
	for (i = startIndex; i <= endIndex; i++){
		currDocId = indexToDocIdMap[i];
		if (classificationDocLabelMap[currDocId+""] != undefined && currDocId in docLabelMap == false){
			url += currDocId + ":" + classificationDocLabelMap[currDocId+""]+",";
		}
	}

	url = url.substring(0,url.length-1);

	//sending in label probs in url
	url += "&docLabelProbMap=";
	for (i = startIndex; i <= endIndex; i++){
		currDocId = indexToDocIdMap[i];
		if (docLabelProbMap[currDocId+""] != undefined && currDocId in docLabelMap == false){
			url += currDocId + ":";
			labelProbs = docLabelProbMap[currDocId+""];
			for(label in labelProbs){
				url += label + ";" + labelProbs[label] + "-";
			}
			url = url.substring(0,url.length-1);
			url += ",";
		}
	}

	url = url.substring(0,url.length-1);

	//sending docToLabel Map as a parameter in url
	url+="&docLabelMap=";

	for (i = startIndex; i <= endIndex; i++){
		currDocId = indexToDocIdMap[i];
		if (docLabelMap[currDocId+""] != undefined){
			url += currDocId + ":" + docLabelMap[currDocId+""]+",";
		}
	}

	url = url.substring(0,url.length-1);
	url += "&isLabelDocs="+"false";

	if(global_study_condition == LA_CONDITION || global_study_condition == LR_CONDITION ){
		mainWindow.topicIndex = "NONE";
		mainWindow.globalPosition = mainWindow.allBaselineDocs.indexOf(mainWindow.docid_wo_topicid)+1;
		mainWindow.positionUnlabeled = mainWindow.allBaselineDocs.indexOf(mainWindow.docid_wo_topicid)-Object.keys(mainWindow.baselineLabeledDocs).length+1;
	}
	else if(global_study_condition == TA_CONDITION || global_study_condition == TR_CONDITION){
		tmp = docid.split("-");
		tmp2 = tmp[0];
		mainWindow.topicIndex = tmp2.substring(5, tmp2.length);
		mainWindow.globalPosition = mainWindow.findDocGlobalPosition(mainWindow.docid_wo_topicid, topicIndex);
		mainWindow.positionUnlabeled = mainWindow.findDocPositionAmongUnlabeled(mainWindow.docid_wo_topicid, topicIndex);
	}
	if(newWindow == null){
		var top = margin;
		var left = screen.width - width - margin;
		if (popUpWindow != null)
			popUpWindow.close();
		newWindow = window.open(url, "Doc display", "status=1" + ", scrollbars=1" +
				", height=" + height +
				", width=" + width +
				", top=" + 20 +
				", left=" + left);
		newWindow.focus();
		popUpWindow = newWindow;
		var closed = true;
	}
	else{
		update_location(newWindow, url);
		newWindow.focus();
	}
	$(newWindow).on("beforeunload", function(){
		var closeTime = Date.now() / 1000;
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		addCloseCrossNormalDocLogs(closeTime, docid_wo_topicid, currMin, currSec);
	});
	mainWindow.takeLogsInServer();

	mainWindow.currLabel = getCurrLabel(mainWindow.docid_wo_topicid, mainWindow.docLabelMap, mainWindow.classificationDocLabelMap);
	mainWindow.labelDefiner = getLabelDefiner(mainWindow.docid_wo_topicid, mainWindow.docLabelMap, mainWindow.classificationDocLabelMap);
	mainWindow.labelConfidence = getLabelConfidence(mainWindow.docid_wo_topicid, mainWindow.docLabelMap,mainWindow.classificationDocLabelMap, mainWindow.maxPosteriorLabelProbMap);
	//load doc logs will get added in DisplayData onload when calling getLoadTime function in data
}

function findDocGlobalPosition(docId, topicIndex){//docid = "topic0-h-31"
	var position = mainWindow.topicToAllDisplayedDocs[""+topicIndex].indexOf(docId);
	return position+1;//to start from 1
}
function findDocPositionAmongUnlabeled(docId, topicIndex){
	// <=0 for user labeled docs is the last labeled doc
	var globalPosition = findDocGlobalPosition(docId, topicIndex);
	var labeled = mainWindow.labeledTopicsDocs[topicIndex];
	var positionInUnlabled = globalPosition-Object.keys(labeled).length;
	return positionInUnlabled;
}
function canRunClassifier(localDocLabelMap){
	var numUniqueUsedLabels = 0;
	var uniqueUsedLabels = [];//labels that user has assigned and still exists (has not deleted yet)
	for(var docId in localDocLabelMap){
		var label = localDocLabelMap[docId];
		if(uniqueUsedLabels.indexOf(label) == -1){
			numUniqueUsedLabels++;
			uniqueUsedLabels.push(label);
		}
	}
	if(Object.keys(localDocLabelMap).length >= 2 && numUniqueUsedLabels >= 2){
		return true;
	}
	return false;
}


//added by yuening
function startTimer(){
	if (second == 0) {
		second = 60;
		minute = minute - 1;
	}

	second = second - 1;

	if (minute >= 0) {
		$('#timing').text(`Time left: ${minute}:${second}`);
	}

	if (minute == 5 && second == 0) {
		var appearTime = new Date().getTime() / 1000;
		alert(minute + " minutes left for labeling!");
		var okTime = new Date().getTime() / 1000;
		var str = "5left";
		var currMin = mainWindow.minute;
		var currSec = mainWindow.second;
		mainWindow.addAlertLogs(str, appearTime, okTime, currMin, currSec);
	}
	if(minute == 15 && second == 0){
		$('#finish_button').removeAttr('disabled');
	}
	if (minute == 0 && second == 0) {
		var alertTime = new Date().getTime() / 1000;
		mainWindow.logStr += "alert time up time="+alertTime+"%0A";
		takeFinalLogs();
		finalClassify();
		alert("Time is up! Thanks for participating.");
        location.href = backend+'/newsession.html';
	}
}
function finishLabeling(){
	var clickTime = Date.now() / 1000;
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	mainWindow.logStr += "alert Thanks for participating="+clickTime+",min="+currMin+",sec="+currSec+"%0A";

	takeFinalLogs();
	finalClassify();
	alert("Thanks for participating.");
    location.href = backend+'/newsession.html';
}
function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex ;
	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

//----------------------------------------------------------------------------------------
//logging functions
function addCloseNormalDocLogs(){
	var closeTime = Date.now() / 1000;
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	mainWindow.addCloseNormalDocLogs(closeTime, currMin, currSec);
	window.close();
}
function closeWindowLabelView(labelName){//for label view
	var closeTime = Date.now () / 1000;
	var currMin = mainWindow.minute;
	var currSec = mainWindow.second;
	mainWindow.addCloseLabelViewLogs(closeTime, labelName, currMin, currSec);
	window.close();
}
