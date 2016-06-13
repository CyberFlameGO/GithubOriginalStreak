"use strict";

function inject() {
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var totalContributions = 0;
    var longestStreak = 0;
    var evaluatingStreak = 0;
    var stop = 0;
    var nonContributingDays = 0;
    var currentStreak = 0;
    var hasNoCurrentStreak = 0;
    var streakFromTo = "";
    var innerStreak = "";
    var firstCommitDate = 0;
    var lastCommitDate = 0;
    var longestStreakStartingDate = 0;
    var longestStreakEndingDate = 0;
    var i18nContributions = chrome.i18n.getMessage('i18nContribution');
    if (!!document.getElementById("contributions-calendar")) {
        var couple = document.getElementById("contributions-calendar").previousElementSibling.childNodes;
        if (couple.length === 1) {
            couple[0].textContent = i18nContributions;
        } else {
            couple[2].textContent = i18nContributions;
        }

        var days = [].slice.call(document.getElementsByClassName("day")).reverse();
        days.forEach(function (day) {
            var todayValue = !! +day.attributes["data-count"].value;
            if (todayValue) {
                totalContributions += +day.attributes["data-count"].value;
                firstCommitDate = new Date(day.attributes["data-date"].value);
            }
            if (todayValue && !lastCommitDate) {
                lastCommitDate = new Date(day.attributes["data-date"].value);
            }
            if (todayValue && !stop) {
                ++currentStreak;
            } else {
                ++nonContributingDays;
                if (stop === 0) {
                    var start = new Date(day.attributes["data-date"].value);
                    var end = new Date();
                    var dayF = start.getUTCDate() + 1;
                    var monthF = monthNames[start.getMonth()];
                    var dayT = end.getUTCDate();
                    var monthT = monthNames[end.getMonth()];
                    streakFromTo = dayF + " " + monthF + " - " + dayT + " " + monthT;
                    stop = 1;
                    innerStreak = streakFromTo;
                }
            }
            if (!currentStreak && nonContributingDays > 1 && todayValue && !hasNoCurrentStreak) {
                var lastCommit = new Date(day.attributes["data-date"].value);
                var diff = Math.abs(new Date().getTime() - lastCommit.getTime());
                var unit = "days";
                var timeDiff = Math.ceil(diff / (1000 * 3600 * 24));
                if (timeDiff === 1) {
                    unit = "day";
                }
                if (timeDiff > 30) {
                    unit = "month";
                    if (timeDiff > 60) {
                        unit = "months";
                    }
                    timeDiff = new Date().getMonth() - lastCommit.getMonth() + 12 * (new Date().getFullYear() - lastCommit.getFullYear());
                }
                hasNoCurrentStreak = "Last contributed <time>" + timeDiff + " " + unit + " ago</time>";
            }
            if (todayValue) {
                ++evaluatingStreak;
            } else {
                evaluatingStreak = 0;
            }
            if (evaluatingStreak > longestStreak) {
                longestStreak = evaluatingStreak;
                longestStreakStartingDate = new Date(day.attributes["data-date"].value);
                longestStreakEndingDate = new Date(day.attributes["data-date"].value);
                longestStreakEndingDate.setDate(longestStreakEndingDate.getDate() + longestStreak - 1);
            }
        });

        if (firstCommitDate) {
            var monthFrom = monthNames[firstCommitDate.getMonth()];
            var dayFrom = firstCommitDate.getUTCDate();
            var yearFrom = firstCommitDate.getFullYear();
            var monthTo = monthNames[lastCommitDate.getMonth()];
            var dayTo = lastCommitDate.getUTCDate();
            var yearTo = lastCommitDate.getFullYear();
            var currentStreakSkeleton = "";
            if (hasNoCurrentStreak) {
                currentStreakSkeleton = "<span class=\"text-muted\">" + hasNoCurrentStreak + "</span>";
            } else {
                currentStreakSkeleton = "<span class=\"text-muted\">" + innerStreak + "</span>";
            }
            var totalSkeleton = "<span class=\"text-muted\">" + monthFrom + " " + dayFrom + " " + yearFrom + " - " + monthTo + " " + dayTo + " " + yearTo + "</span>";
            var skeleton = "<div class=\"contrib-column contrib-column-first table-column\">\n                                    <span class=\"text-muted\">" + chrome.i18n.getMessage('i18nFirstBoxUpper') + "</span>\n                                    <span class=\"contrib-number\">" + totalContributions + " " + chrome.i18n.getMessage('i18nFirstBoxMiddle') + "</span>\n                                    " + totalSkeleton + "\n                                </div>\n                                <div class=\"contrib-column table-column\">\n                                    <span class=\"text-muted\">" + chrome.i18n.getMessage('i18nSecondBoxUpper') + "</span>\n                                    <span class=\"contrib-number\">" + longestStreak + " " + chrome.i18n.getMessage('i18nDays') + "</span>\n                                    <span class=\"text-muted\">\n                                    " + monthNames[longestStreakStartingDate.getMonth()] + " " + longestStreakStartingDate.getUTCDate() + " –\n                                    " + monthNames[longestStreakEndingDate.getMonth()] + " " + longestStreakEndingDate.getUTCDate() + "\n                                    </span>\n                                </div>\n                                <div class=\"contrib-column table-column\">\n                                    <span class=\"text-muted\">" + chrome.i18n.getMessage('i18nThirdBoxUpper') + "</span>\n                                    <span class=\"contrib-number\">" + currentStreak + " " + chrome.i18n.getMessage('i18nDays') + "</span>\n                                    " + currentStreakSkeleton + "\n                                </div>";
            var range = document.createRange();
            range.selectNode(document.getElementById("contributions-calendar"));
            var documentFragment = range.createContextualFragment(skeleton);
            document.getElementById("contributions-calendar").appendChild(documentFragment);
        }
    }
}

function attachClickInjecter() {
    var pixelBar = document.getElementById("js-pjax-loader-bar");
    var config = { attributes: true, childList: true, characterData: true, attributeOldValue: true };
    [].slice.call(document.getElementsByClassName("tabnav-tab")).forEach(function (tab) {
        tab.addEventListener('click', function () {
            //on "Repo" click the event is deattached
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.oldValue && mutation.oldValue.indexOf("is-loading") > 0) {
                        inject();
                        attachClickInjecter();
                        observer.disconnect();
                    }
                });
            });
            observer.observe(pixelBar, config);
        }, false);
    });
}

(function () {
    inject();
    attachClickInjecter();
})();