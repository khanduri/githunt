function HubTab() {

    var trendingRequest = false,              // To make sure that there are no parallel requests
        repoGroupSelector = '.content-batch', // Batch of repositories
        filterSelector = '.repos-filter',     // Selector that matches every repo filter on page
        mainContainer = '.main-content',      // Main container div
        dateHead = '.date-head',              // Heading item for the batch of repositories
        dateAttribute = 'date',               // Date attribute on the date head of batch
        // token = 'a1a420cbad0a4d3eccda',    // API token. Don't grin, it's a dummy
        languageFilter = '#language',         // Filter for repositories language
        dateFilter = '#date-jump',            // Date jump filter i.e. weekly, monthly or yearly
        tokenStorageKey = 'githunt_token',    // Storage key for the github token
        requestCount = 0,                     // Track the count of how many times the refresh was tried
        reposApiUrl = 'https://api.github.com/search/repositories', // URL for the repos

        // All the content from last hunt will be cached in localstorage for some time to avoid
        // requests on each tab change
        huntResultKey = 'last_hunt_result',
        refreshDuration = '180',               // Minutes for which cache will be kept
        huntTImeKey = 'last_hunt_time';        // The time for last hunt

    var filterStorage = new HubStorage();

    function generateReposHtml(repositories, lowerDate, upperDate) {
        var html = '';

        $(repositories).each(function (index, repo) {
            // Make the name and description XSS safe
            var repFullName = $('<div>').text(repo.name).html();
            var ownerAvatarUrl = $('<div>').text(repo.owner.avatar_url).html();
            var ownerHandle = $('<div>').text(repo.owner.login).html();
            var ownerUrl = $('<div>').text(repo.owner.url).html();
            var repFullDesc = $('<div>').text(repo.description).html();

            img = '<img class="card-img-top" data-src="' + ownerAvatarUrl + '" alt="Card image cap">';
            title = '<h6 class="card-title"><a href="' + repo.html_url + '">' + repFullName + '</a></h6>'
            desc = '<small><p class="card-text">' + repFullDesc + '</p></small>'

            forks = '<span class="card-link"><i class="fa fa-code-fork"></i>&nbsp;' +repo.forks_count +'</span>';
            issues = '<span class="card-link"><i class="fa fa-commenting-o"></i>&nbsp;'+repo.open_issues +'</span>';
            stars = '<span class="card-link"><i class="fa fa-star-o"></i>&nbsp;'+repo.stargazers_count +'</span>';

            owner_a = 'by: <a href="' + ownerUrl + '">' + ownerHandle + '</a>'
            owner = '<ul class="list-group list-group-flush"><li class="list-group-item">' + owner_a + '</li></ul>';

            stats = '<span class="footer">' + owner + forks + issues + stars + '<footer>';

            cardContent =  title + desc + stats;
            html += '<div class="content-item card card-block">' + cardContent+ '</div>';
        });

        var formattedLower = moment(lowerDate).format('ll'),
            formattedUpper = moment(upperDate).format('ll');

        var timeRange = '<h4 data-date="' + lowerDate + '">' + formattedLower + ' &ndash; ' + formattedUpper + '</h4>';

        var finalHtml = '<div class="content-batch">' + timeRange + html + '<div class="clearfix"></div></div>';
        return finalHtml;
    }

    var getNextDateRange = function () {
        var lastFetched = $(repoGroupSelector).last().find(dateHead).data(dateAttribute),
            dateRange = {},
            dateJump = $(dateFilter).val();

        if (lastFetched) {
            dateRange.upper = lastFetched;
            dateRange.lower = moment(lastFetched).subtract(1, dateJump).format('YYYY-MM-DD');
        } else {
            dateRange.upper = moment().format('YYYY-MM-DD');
            dateRange.lower = moment().add(1, 'day').subtract(1, dateJump).format('YYYY-MM-DD');
        }

        return dateRange;
    };

    var getApiFilters = function () {
        var dateRange = getNextDateRange(),
            language = $(languageFilter).val(),
            langCondition = '';

        if (language) {
            langCondition = 'language:' + language + ' ';
        }

        var token = $.trim(filterStorage.getStorage().getItem(tokenStorageKey)),
            apiToken = '';

        if (token) {
            apiToken = '&access_token=' + token;
        }

        return {
            queryParams: '?sort=stars&order=desc&q=' + langCondition + 'created:"' + dateRange.lower + ' .. ' + dateRange.upper + '"' + apiToken,
            dateRange: dateRange
        };
    };

    var saveHuntResult = function () {
        var huntResults = $('.main-content').html();
        if (!huntResults) {
            return false;
        }

        filterStorage.getStorage().setItem(huntResultKey, huntResults);
        filterStorage.getStorage().setItem(huntTImeKey, moment().format('YYYY-MM-DD HH:mm:ss'));
    };


    var shouldRefresh = function () {
        if (requestCount !== 0) {
            return true;
        }

        var lastHuntResult = filterStorage.getStorage().getItem(huntResultKey),
            lastHuntTime = filterStorage.getStorage().getItem(huntTImeKey);
        if (!lastHuntResult || !lastHuntTime || $.trim(lastHuntResult) === 'undefined') {
            return true;
        }

        var now = moment();
        var then = moment(lastHuntTime, 'YYYY-MM-DD HH:mm:ss');
        if (now.diff(then, 'minutes') >= refreshDuration) {
            return true;
        }

        $(mainContainer).html(lastHuntResult);
        requestCount++;

        return false;
    };

    var fetchTrendingRepos = function () {

        if ((trendingRequest !== false) || ($('.error-quote').length !== 0)) {
            return false;
        }

        if(shouldRefresh() === false) {
            return false;
        }

        var filters = getApiFilters(),
            url = reposApiUrl + filters.queryParams;

        trendingRequest = $.ajax({
            url: url,
            method: 'get',
            beforeSend: function () {
                $('.loading-more').removeClass('hide');
            },
            success: function (data) {
                var finalHtml = generateReposHtml(data.items, filters.dateRange.lower, filters.dateRange.upper);
                $(mainContainer).append(finalHtml);
            },
            error: function(xhr, status, error) {
                var error = JSON.parse(xhr.responseText),
                    message = error.message || '';

                if (message && message.toLowerCase() == 'bad credentials') {
                    $('.main-content').replaceWith('<h3 class="quote-item error-quote">Oops! Seems to be a problem with your API token. Could you verify the API token you entered in extension options.</h3>');

                    filterStorage.getStorage().removeItem(tokenStorageKey);
                } else if (message && (message.indexOf('rate limit') !== -1)) {
                    $('.main-content').replaceWith('<h3 class="quote-item error-quote">Oops! Seems like you did not set the API token. Wait another hour for github to refresh your rate limit or better add a token in `Githunt Options` to hunt more.</h3>');
                } else {
                    $('.main-content').replaceWith('Oops! Could you please refresh the page.');
                }
            },
            complete: function () {
                trendingRequest = false;
                $('.loading-more').addClass('hide');

                saveHuntResult();
            }
        });
    };

    var refreshRepoView = function () {
          requestCount++;

          $(repoGroupSelector).remove();
          filterStorage.persistFilters(filterSelector);
          fetchTrendingRepos();
    }

    var bindUI = function () {

        $(window).on('scroll', function () {
            if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
                fetchTrendingRepos();
            }
        });

        $(document).on('change', filterSelector, function () {
            refreshRepoView();
        });
        $('.search').keypress(function (e) {
            if (e.which == 13) {
              refreshRepoView();
            }
        });
    };

    return {
        init: function () {
            bindUI();
            this.refresh();
        },
        refresh: function () {
            filterStorage.populateFilters(filterSelector);
            fetchTrendingRepos();
        }
    };
}

$(function () {
    var hubTab = new HubTab();
    hubTab.init();
});
