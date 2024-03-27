var topBar = document.getElementById('topBar');
var lastScrollTop = 0;
var scrollThreshold = 100; 
window.addEventListener('scroll', function() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
        topBar.classList.add('hidden');
    } else {
        topBar.classList.remove('hidden');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

  function generate() {
    const numQuestions = 10;
  
    if (!isNaN(numQuestions) && numQuestions > 0) {
      const doc = new docx.Document({
          sections: []
      });

      const section = {
          properties: {},
          children: []
      };

      const options = ['Option1', 'Option2', 'Option3', 'Option4'];

      for (let i = 1; i <= numQuestions; i++) {
          const question = `Question ${i}: This is a sample question.\n`;
          const correctAnswerIndex = 1+Math.floor(Math.random() * 4);
          let option1 = 'A. Option1\n';
          let option2 = 'B. Option2\n';
          let option3 = 'C. Option3\n';
          let option4 = 'D. Option4\n';

          if(correctAnswerIndex == 1) option1 = '*A. Option1\n';
          else if(correctAnswerIndex == 2) option2 = '*B. Option2\n';
          else if(correctAnswerIndex == 3) option3 = '*C. Option3\n';
          else if(correctAnswerIndex == 4) option4 = '*D. Option4\n';

          section.children.push(
              new docx.Paragraph({
                  children: [
                      new docx.TextRun(question),
                      new docx.TextRun({
                        text: option1,
                        break: 1 
                      }),
                      new docx.TextRun({
                        text: option2,
                        break: 1 
                      }),
                      new docx.TextRun({
                        text: option3,
                        break: 1 
                      }),
                      new docx.TextRun({
                        text: option4,
                        break: 1 
                      }),
                      new docx.TextRun({
                        text: "",
                        break: 1 
                      }),

                  ]
              })
          );
      }

      doc.addSection(section);

      docx.Packer.toBlob(doc).then((blob) => {
          console.log(blob);
          saveAs(blob, "Quiz_Template.docx");
      });
    }
    else {
      alert("Error");
  }
}



document.getElementById('downloadQTI').addEventListener('click', function() {
  var fileInput = document.getElementById('fileUploads');
  var file = fileInput.files[0];
  if (!file) {
      alert('Please select a file.');
      return;
  }

  mammoth.extractRawText({arrayBuffer: file})
      .then(function(result) {
          var text = result.value;
          processText(text);
        })
      .catch(function(err) {
          console.log(err);
      });
      
});


function processText(text) {
  const optionValueMap = {};
  const startCharCode = 'A'.charCodeAt(0);
  for (let i = 0; i < 26; i++) {
    optionValueMap[String.fromCharCode(startCharCode + i)] = i + 1;
  }


  const questions = text.trim().split('\n\n');
  const csvQuestions = questions.map((question, index) => {
    const lines = question.trim().split('\n');
    const qNumber = `Question ${index + 1}`;
    const qText = lines[0].substring(lines[0].indexOf(':') + 2); 
    const options = lines.slice(1).map((option, optionIndex) => {
      const isCorrect = option.startsWith('*');
      const optionText = option.replace(/^\*?([A-Z])\.\s(.*)/, '$1');
      const optionValue = optionValueMap[optionText];
      return { text: option.replace(/^\*?[A-Z]\.\s/, '').trim(), value: optionValue, correct: isCorrect };
    });
    const correctOptions = options.filter(option => option.correct).map(option => option.value).join(',');
    const responseType = correctOptions.length > 1 ? 'MR' : 'MC';
    return `${responseType},${qNumber},"${qText}",${correctOptions},"${options.map(option => option.text).join(',')}"`; 
  });

  const csvString = csvQuestions.join('\n');

  console.log(csvString);
  convertTextToQTI(csvString);

}

function downloadQTI(fileName, content) {
  const zip = new JSZip();
  zip.file(fileName, content);

  zip.generateAsync({ type: 'blob' }).then(function (blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quiz.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}


function convertTextToQTI(text) {
  let id = 0;
  let qtiXML = '<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2">';
  qtiXML += '<assessment ident="iab458f4b361834dd802e4f40d31b5ebc" title="Quiz">';
  qtiXML += '<qtimetadata>';
  qtiXML += '<qtimetadatafield>';
  qtiXML += '<fieldlabel>cc_maxattempts</fieldlabel>';
  qtiXML += '<fieldentry>1</fieldentry>';
  qtiXML += '</qtimetadatafield>';
  qtiXML += '</qtimetadata>';
  qtiXML += '<section ident="root_section">';

  const rows = text.split('\n');

  rows.forEach((row) => {
    const columns = row.split(',');
    columns.forEach((element, index) => {
      console.log(`Index ${index}: ${element}`);
  });

    id += 1000;
    qtiXML += '<item ident="' + columns[0] + '" title="' + columns[1] + '">';
    qtiXML += '<itemmetadata>';
    qtiXML += '<qtimetadata>';
    qtiXML += '<qtimetadatafield>';
    qtiXML += '<fieldlabel>question_type</fieldlabel>';
    qtiXML += '<fieldentry>' + (columns[0] === 'MC' ? 'multiple_choice_question' : 'multiple_response_question') + '</fieldentry>';
    qtiXML += '</qtimetadatafield>';
    qtiXML += '<qtimetadatafield>';
    qtiXML += '<fieldlabel>points_possible</fieldlabel>';
    qtiXML += '<fieldentry>1</fieldentry>';
    qtiXML += '</qtimetadatafield>';
    qtiXML += '<qtimetadatafield>';
    qtiXML += '<fieldentry>' + columns[2] + '</fieldentry>';
    qtiXML += '</qtimetadatafield>';
    qtiXML += '<qtimetadatafield>';
    qtiXML += '<fieldlabel>assessment_question_identifierref</fieldlabel>';
    qtiXML += '<fieldentry>' + columns[0] + '</fieldentry>';
    qtiXML += '</qtimetadatafield>';
    qtiXML += '</qtimetadata>';
    qtiXML += '</itemmetadata>';
    qtiXML += '<presentation>';
    qtiXML += '<material><mattext texttype="text/html">' + columns[2] + '</mattext></material>';
    qtiXML += '<response_lid ident="response1" rcardinality="' + (columns[0] === 'MC' ? 'Single' : 'Multiple') + '">';
    qtiXML += '<render_choice>';

    const options = columns.slice(4).filter(option => option.trim() !== '');
    options.forEach((option, idx) => {
        qtiXML += '<response_label ident="' + (id + idx + 1) + '">';
        qtiXML += '<material><mattext texttype="text/plain">' + option.trim() + '</mattext></material>';
        qtiXML += '</response_label>';
    });

    qtiXML += '</render_choice>';
    qtiXML += '</response_lid>';
    qtiXML += '</presentation>';
    qtiXML += '<resprocessing>';
    qtiXML += '<outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>';
    qtiXML += '<respcondition continue="No">';
    qtiXML += '<conditionvar>';

    if (columns[0] === 'MC') {
      qtiXML += '<varequal respident="response1">' + (id + parseInt(columns[3])) + '</varequal>';
    } else {
      qtiXML += '<and>';

      const indices_adjusted = columns[3].split(",").map(index => parseInt(index) - 1 + id);

      for (let ind = id; ind < id + options.length; ind++) {
        if (indices_adjusted.includes(ind)) {
          qtiXML += '<varequal respident="response1">' + ind + '</varequal>';
        } else {
          qtiXML += '<not><varequal respident="response1">' + ind + '</varequal></not>';
        }
      }
      qtiXML += '</and>';
    }

    qtiXML += '</conditionvar>';
    qtiXML += '<setvar action="Set" varname="SCORE">100</setvar>';
    qtiXML += '</respcondition>';
    qtiXML += '</resprocessing>';
    qtiXML += '</item>';
  });

  qtiXML += '</section>';
  qtiXML += '</assessment>';
  qtiXML += '</questestinterop>';

  downloadQTI('quiz.xml', qtiXML);
}

