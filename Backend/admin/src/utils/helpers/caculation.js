/**
 Dashbord
 ======================================
TopWebApps ==>((webapp duration / sum of top 10 webapps) * 100)

Top Location and Department ==>((duration / sum of top 4 location or dept) * 100)

Top productive and nonproductive ==> ((productive or non productive / (productive_duration + non_productive_duration + neutral_duration + idle_duration + break_duration)) * 100)

Activity breakdown ==>
    computer_activities_time==> non_productive_duration + productive_duration + neutral_duration
    office_time ==> non_productive_duration + productive_duration + neutral_duration + break_duration + idle_duration
    productive Per==>  (productive_duration / office_time) * 100
    nonProductive Per==>  (non_productive_duration / office_time) * 100
    neutral Per==>  (neutral_duration / office_time) * 100

Timesheet
===============================================
computer_activities_time==> non_productive_duration + productive_duration + neutral_duration
office_time ==> non_productive_duration + productive_duration + neutral_duration + break_duration + idle_duration
productivePer==>  (productive_duration / office_time) * 100
total_time==> checkin-checkout
offline==> total_time-office_time

Email report
================================================
compared to previous==> current productivity - previous productivity
time and attendance==> ((present_count / (total_count * totalDays)) * 100)

Note
------
For tce instead of office time using 30600
 */
