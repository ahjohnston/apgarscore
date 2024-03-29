import React, { useState } from "react";
import Table from "react-bootstrap/Table";
import axios from "axios";
import { useEffect } from "react";
import { GoalGrid } from "./GoalGrid";

export function ViewGoals() {
  // const [allGoals, setAllGoals] = useState({});
  const [dailyGoals, setDailyGoals] = useState([]);
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[] | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(2); //TODO persist this as a 'user setting' or something
  const weekOf = getFirstDayOfWeek();
  const weekEnds = getLastDayOfWeek();

  type Goal = {
    id: number;
    records: Record[];
    goalName: string;
    cadence: string;
    min_progress_events: number;
    category?: string;
    active: boolean;
  };
  type Record = {
    id: number | undefined;
    goalID?: number;
    plan?: string | undefined | null;
    planDate: Date | null;
    dateComplete?: Date | null | undefined;
  };
  type RecordResponse = {
    id: number | null;
    goalID: number;
    plan?: string | undefined | null;
    planDate?: string | null;
    dateComplete: string | null;
  };

  useEffect(() => {
    axios<Goal[]>({
      method: "get",
      url: "http://localhost:8080/goals/view?cadence=weekly",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
      .then(function (response) {
        setWeeklyGoals(
          response.data.map((datum) => {
            return {
              id: datum.id,
              goalName: datum.goalName,
              cadence: datum.cadence,
              min_progress_events: datum.min_progress_events,
              category: datum.category,
              active: datum.active,
              records: datum.records.map((record) => {
                return {
                  id: record.id,
                  goalID: record.goalID,
                  plan: record.plan,
                  planDate: record.planDate,
                  dateComplete: record.dateComplete
                    ? new Date(record.dateComplete)
                    : null,
                };
              }),
            };
          })
        );
      })
      .catch(function (error) {});
    axios({
      method: "get",
      url: "http://localhost:8080/goals/view?cadence=daily",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
      .then(function (response) {
        setDailyGoals(response.data);
      })
      .catch(function (error) {
        console.log("error", error);
      });
  }, [weeklyGoals]);
  //second parameter for useEffect of an empty array means this will not run continuously
  //removing the second parameter --> runs continuously --> insufficient resources error
  //[weeklyGoals] --> useEffect will run whenever weeklyGoals changes. GOOD.

  function postNewRecord(params: Record) {
    axios({
      method: "post",
      url: "http://localhost:8080/records/add",
      params: params,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
      .then((response) => {})
      .catch((error) => {
        console.log("error sir", error);
      });
  }

  function patchRecord(params: Record) {
    axios({
      method: "patch",
      url: "http://localhost:8080/records/byId",
      params: params,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
      .then((response) => {})
      .catch((error) => {
        console.log("error sir", error);
      });
  }

  function markComplete(e: { target: any }) {
    const { id, checked } = e.target;
    const myRecord: Record = {
      id: id,
      planDate: selectedDate,
      dateComplete: checked ? selectedDate : null,
    };
    //if the record does not exist, do a POST
    if (id == undefined) {
      //TODO default id shouldn't be 0, it should be null or undefined
      postNewRecord(myRecord);
    } else {
      //if the recore already exists, do a PATCH
      //BUG this must include a 'plan' string (or null/undefined)
      patchRecord(myRecord);
    }
  }
  //TODO does it make sense to combine "updatePlan" with "markComplete" --> updateRecord? hmm doesn't seem Clean
  function updatePlan(e: any) {
    const { id, name, value } = e.target;
    const params: Record = {
      id: id,
      goalID: name,
      plan: value,
      planDate: selectedDate, //default planDate is the 'selected date' from state
    };

    //if the record does not exist, do a POST
    if (!id) {
      postNewRecord(params);
    } else {
      //if the recore already exists, do a PATCH
      patchRecord(params);
    }
  }
  function changeFirstDayOfWeek(e: { target: any }) {
    setFirstDayOfWeek(Number(e.target.value));
  }
  //TODO is there a simpler way to do this? am i dumb?
  function getFirstDayOfWeek() {
    const differenceBetweenDays: number =
      selectedDate.getDay() - firstDayOfWeek;
    let myDate = new Date(selectedDate.toString());
    if (differenceBetweenDays > 0) {
      myDate.setDate(
        selectedDate.getDate() - selectedDate.getDay() + firstDayOfWeek
      );
      return myDate;
    } else if (differenceBetweenDays < 0) {
      myDate.setDate(
        selectedDate.getDate() - selectedDate.getDay() + firstDayOfWeek - 7
      );
      return myDate;
    } else {
      //TODO BUG week range is incorrect in this case
      return selectedDate;
    }
  }
  function getLastDayOfWeek() {
    let myDate = new Date(weekOf.toString());
    myDate.setDate(weekOf.getDate() + 6);
    return myDate;
  }
  function onDateChange(e: any) {
    setSelectedDate(new Date(e.target.value));
  }

  return (
    <div>
      <div>
        Select Date:
        <input
          type="date"
          onChange={onDateChange}
          value={selectedDate.toISOString().split("T")[0]} //must be in yyyy-mm-dd format
          name="weekly"
        ></input>
      </div>

      {/* <div>
        <h2> Daily Goals</h2>
        <input
          type="date"
          onChange={onDateChange}
          value={selectedDate.toString().slice(0) || ''}
          name="daily"
        ></input>
        <Table bordered striped>
          <thead>
            <tr>
              <th>Done</th>
              <th>Goal Name</th>
              <th>Plan</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {dailyGoals.length > 0
              ? dailyGoals.map((goal) => {
                  let complete = false,
                    recordId = null,
                    recordPlan = "", //this didn't work using NULL (the previous plan would stick around, instead of the placeholder text)
                    recordMatch = false;
                  if (goal.records.length > 0) {
                    goal.records.map((record) => {
                      //if completion date === dateSelected, complete = true
                    });
                  }
                  //the key to this nested .map was to include a return statement for each .map
                  return (
                    <tr key={goal.id}>
                      <td>
                        <input
                          id={recordId}
                          name={goal.id}
                          type="checkbox"
                          checked={complete}
                          onChange={markComplete}
                        ></input>
                      </td>
                      <td> {goal.goalName}</td>
                      <td>
                        <input
                          id={recordId}
                          name={goal.id}
                          type="text"
                          placeholder="Add your plan here"
                          value={recordPlan}
                          onChange={updatePlan}
                        ></input>
                      </td>
                      <td>
                        <button>Edit</button>
                      </td>
                      <td>
                        <button>Delete</button>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </Table>
      </div> */}
      <div>
        <h2>Weekly Goals</h2>
        <h3>
          My week starts on
          <select onChange={changeFirstDayOfWeek}>
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>Ï{" "}
          </select>
        </h3>
        {/* TODO format the week date range in a cute way*/}
        <h5>
          Week of: {weekOf.toString().slice(4, 10)} -
          {weekEnds.toString().slice(4, 10)}
        </h5>
        <Table bordered striped>
          <thead>
            <tr>
              <th>Done</th>
              <th>Goal Name</th>
              <th>Plan</th>
              <th>Edit this Goal</th>
            </tr>
          </thead>
          <tbody>
            {weeklyGoals && weeklyGoals.length > 0
              ? weeklyGoals.map((goal: Goal) => {
                  let complete: boolean | null | undefined = false,
                    recordId: number | undefined = undefined,
                    recordPlan: string | null | undefined = ""; //this didn't work using NULL (the previous plan would stick around, instead of the placeholder text)
                  //TODO move this functionality to the backend
                  //instead of mapping through goals/records, and filtering by date
                  //just make a get request  for recordsByGoalId / recordsByDate
                  if (goal.records.length > 0) {
                    goal.records.map((record: Record) => {

                      if (
                        record.planDate &&
                        weekOf < new Date(record.planDate) &&
                        new Date(record.planDate) < weekEnds
                      ) {
                        recordId = record.id;
                        recordPlan = record.plan;
                      }
                      complete =
                        record.dateComplete &&
                        weekOf < record.dateComplete &&
                        record.dateComplete < weekEnds;
                    });
                  }
                  //the key to this nested .map was to include a return statement for each .map
                  return (
                    <tr key={goal.id}>
                      <td>
                        <input
                          id={recordId}
                          key={recordId}
                          name={goal.id.toString()}
                          type="checkbox"
                          checked={complete}
                          onChange={markComplete}
                        ></input>
                      </td>
                      <td> {goal.goalName}</td>
                      <td>
                        <input
                          id={recordId}
                          key={recordId} //TS doesn't like when I use 'id' here, since I've defined 'id' elsewhere. Dumb??
                          //TODO BUG after typing one character in an empty plan (ie, a POST request)
                          //the text field loses focus, and user has to re-select
                          name={goal.id.toString()}
                          type="text"
                          placeholder="Add your plan here"
                          value={recordPlan || undefined}
                          onChange={updatePlan}
                        ></input>
                      </td>
                      <td>
                        <button>Edit</button>
                        {/*TODO add an 'Edit Goal' modal (re-use Add New Goal modal)
                        add an 'active' toggle
                        add a filter in the Goal Grid, to only show active goals */}
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
