function saveJax(topicId) {
    var topic = $("#" + topicId);

    if (topic.hasClass("topic-interested")) {
        delJax("/", { topicId: topicId },
            function (result, status) {
                console.log(result);
                topic.removeClass("topic-interested");
            },
            function (request, status, error) {
                console.error(error);
            }
        );
    } else {
        postJax("/", { topicId: topicId },
            function (result, status) {
                console.log(result);
                topic.addClass("topic-interested");
            },
            function (request, status, error) {
                console.error(error);
            }
        );
    }
}

function doOnLoad(topics, isLoggedIn) {
    if (!isLoggedIn) {
        $(document).on('click', function (e) {
            if (e?.target?.href?.includes("auth") || e?.target?.className == 'allow') {
                //do nothing, aka don't show login
                //popup if user clicks on a login link
                return
            }
            e.preventDefault();
            $("#modalLogin").modal({
                escapeClose: false,
                clickClose: false,
                showClose: false
            });
        });
    }

    $("#descform").validate({
        rules: {
            desc: {
                required: true,
                minlength: 20
            }
        }
    });

    $("#newtopic").autocomplete({
        minLength: 0,
        source: topics,

        focus: function (event, ui) {
            if (ui.item.ignore !== "ig") {
                $("#newtopic").val(ui.item.label);
            }
            return false;
        },
        select: function (event, ui) {
            if (ui.item.ignore !== "ig") {
                $("#newtopic").val(ui.item.label);
                $("#newtopic-id").val(ui.item._id);
            }

            return false;
        },
        response: function (event, ui) {

            // ui.content is the array that's about to be sent to the response callback.
            if (ui.content.length === 0) {
                //$("#emptyMessage").text("No results found");
                $("#spanAddTopic").show();
                ui.content.push({
                    label: '<input type="button" onclick="$(\'#formAddTopic\').submit();" value="Add New Topic" id="addTopic"/> No results found',
                    button: true,
                    ignore: 'ig'
                });
            } else {
                //$("#emptyMessage").empty();
                $("#spanAddTopic").hide();
            }

        }
    }).autocomplete("instance")._renderItem = function (ul, item) {
        return $("<li>")
            .append("<div>" + item.label + "</div>")
            .appendTo(ul);
    };


}