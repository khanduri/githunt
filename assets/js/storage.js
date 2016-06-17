/**
 * Hub Storage to assist in storing the filter to localStorage
 * and retrieving to populate back
 */
function HubStorage() {

    // Returns the storage object if available, otherwise a polyfill
    var getStorage = function () {
        if (window.localStorage) {
            return window.localStorage;
        }

        return {
            setItem: function () {},
            getItem: function () {}
        }
    };

    // Persists the values of the provided input input selector
    var persistFilters = function (selector) {
        var storage = getStorage();

        $(selector).each(function(index, input){
            var $input = $(input),
                name = $input.attr('name');

            storage.setItem(name, $input.val());
        });
    };

    // Retrieves values for provided selector from localstorage and populates fields back
    var populateFilters = function (selector) {
        var storage = getStorage(),
            anyPopulated = false;

        $(selector).each(function(index, input){
            var $input = $(input),
                name = $input.attr('name'),
                value = storage.getItem(name);

            if (value) {
                $input.val(value);
                anyPopulated = true;
            }
        });

        return anyPopulated;
    };

    return {
        persistFilters: function (selector) {persistFilters(selector);},
        populateFilters: function (selector) {return populateFilters(selector);},
        getStorage: function () {return getStorage();}
    };
}
