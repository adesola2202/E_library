let dash_field = $(".page-inner")
console.log(dash_field);

$('#regstaff').on('click', function(){
    $.ajax({
        type:"GET",
        url:"/register/staff",
        success:function(data){
            dash_field.html(data)
        },
        beforeSend:function(){
            alert("loading")
        },
        error:function(){
            alert("unable to load page")
        }

    })
});
