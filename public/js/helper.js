//file chooser script
$("input[type='image']").click(function() {
    $("input[id='fileChooseId']").click();
});

function previewAndSubmit(){
    var image=document.getElementById("fileChooseId").files[0];
    var preview=document.getElementById("creatorImage");
    var fileChoose=document.getElementById("fileChoose");
    var form = document.getElementById("uploadForm");

    var reader = new FileReader();

    reader.onload= function(e){
        fileChoose.style.backgroundImage='url(' + reader.result + ')';
        fileChoose.style.borderRadius = '50%';
    };

    if(image) {
        reader.readAsDataURL(image);
        //document.forms['uploadForm'].submit();
    }
}

module.exports.previewAndSubmit=previewAndSubmit;
