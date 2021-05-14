var API_URL = "https://spicedify.herokuapp.com/spotify";

var SCROLL_THRESHOLD = 300;
var SCROLL_TIMEOUT = 500;

function getItemsFromResponse(data, type) {
    if (type === "artist") {
        return data.artists;
    }
    if (type === "album") {
        return data.albums;
    }
}

function isScrollInfinite() {
    return window.location.search.indexOf("scroll=infinite") > -1;
}

function checkScroll(callback) {
    var scrollTop = $(window).scrollTop();
    var winHeight = $(window).height();
    var docHeight = $(document).height();

    var hasScrolledBottom =
        scrollTop + winHeight >= docHeight - SCROLL_THRESHOLD;

    if (hasScrolledBottom) {
        callback();
    } else {
        setTimeout(() => {
            checkScroll(callback);
        }, SCROLL_TIMEOUT);
    }
}

(function () {
    console.log("Spotify Search");
    var $form = $("form");
    var $type = $(".type-field");
    var $results = $(".results");
    var $resultList = $(".result-list");
    var $resultTitle = $(".result-title");
    var $loadMoreButton = $(".load-more-button");

    var params;

    function renderResults(results, query) {
        if (results.items.length === 0) {
            $resultTitle.text('No results for "' + query + '"');
            $loadMoreButton.hide();
            return;
        }
        $resultTitle.text('Results for "' + query + '"');

        results.items.forEach(function (item) {
            var $listItem = $("<li></li>", { class: "result" });

            var imgUrl = "https://via.placeholder.com/200x200";

            if (item.images.length > 0) {
                imgUrl = item.images[0].url;
            }

            var $img = $("<img></img>", { src: imgUrl });
            $listItem.append($img);

            var $link = $("<a></a>", {
                text: item.name,
                href: item.external_urls.spotify,
                target: "_blank",
            });

            $listItem.append($link);

            $resultList.append($listItem);

            if (results.next) {
                $loadMoreButton.show();
            } else {
                $loadMoreButton.hide();
            }

            // prevents multiple event listener to be attached
            $loadMoreButton.off("click");
            $loadMoreButton.on("click", function () {
                getMoreResults(results.next);
            });
        });
    }

    function getFormValues() {
        var $inputField = $form.find(".text-field");
        var query = $inputField.val();
        var type = $type.val();

        return {
            q: query,
            type: type,
        };
    }

    var nextURL;

    function getMoreResults(nextURL) {
        var spicedURL = nextURL.replace(
            "https://api.spotify.com/v1/search",
            API_URL
        );

        $.get(spicedURL, function (data) {
            var results = getItemsFromResponse(data, params.type);
            renderResults(results, params.q);

            if (!results.next) {
                return;
            }

            nextURL = results.next.replace(
                "https://api.spotify.com/v1/search",
                API_URL
            );

            if (!isScrollInfinite()) {
                return;
            }

            var callback = function () {
                console.log("reached bottom!");
                getMoreResults(results.next);
            };

            checkScroll(callback);
        });
    }

    $results.addClass("loading");

    $form.on("submit", function (e) {
        e.preventDefault();

        params = getFormValues();

        $resultList.empty();

        $.get(API_URL, params, function succes(data) {
            var results = getItemsFromResponse(data, params.type);

            $results.removeClass("loading");

            $resultList.empty();

            renderResults(results, params.q);

            if (!results.next) {
                return;
            }

            nextURL = results.next.replace(
                "https://api.spotify.com/v1/search",
                API_URL
            );

            if (!isScrollInfinite()) {
                return;
            }

            // the callback is anonymous here
            checkScroll(function () {
                console.log("reached bottom!");
                getMoreResults(results.next);
            });
        });
    });
})();
