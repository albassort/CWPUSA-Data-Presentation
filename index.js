import './index.css'
import Alpine from 'alpinejs'
import fs from "fs/promises";

window.Alpine = Alpine;

let options;
let codes = [];
let nation;
let states;
let state_data;

// Alpine.data('dropdown', () => { console.log("Hello") })
(async ()=> {

const us = await fetch (
             'https://cdn.jsdelivr.net/npm/us-atlas/states-10m.json')
             .then((r) => r.json());
nation =
  ChartGeo.topojson.feature(us, us.objects.nation).features[0];
states =
  ChartGeo.topojson.feature(us, us.objects.states).features;
state_data =
  Object.groupBy(states, ({ properties }) => properties.name);



// console.log(state_data);
try{
  await alasql.promise ('CREATE DATABASE IF NOT EXISTS data');
} catch (e){/**/};



let sources = ["food", "steel"]
await Promise.all([alasql.promise('USE data')]);
await Promise.all([alasql.promise (`create table if not exists data.data;`)]);

await Promise.all(
  sources.map(source =>
    alasql.promise(
      `SELECT * INTO data.data FROM CSV("./data/${source}",{headers:true})`
    )
  )
);

Alpine.store("app").options =
  await alasql.promise ('SELECT distinct NAICS, Meaning from data.data')


  update(311);
})();

const ctx = document.getElementById("chartjs");
let chart = 0
function processNumber (number)
{
  if (typeof number === "string")
  {
    number = number.replaceAll(",", "");
    number = parseInt (number)
  }
  if (number === "D")
  {
    number = 0
  }
  if (Number.isNaN(number))
  {
    number = 0;
  }
  if (number === undefined)
  {
    number = 0;
  }

  return number
}

function makeLabel (x)
{
  const cat = Alpine.store("app").category;
  const lastTwo = cat.slice(-2); // "pt"
  if (lastTwo === "_D")
  {
    return `${x.raw.feature.properties.name} - $${x.formattedValue}`
  }
  else
  {
    return `${x.raw.feature.properties.name} - ${x.formattedValue}`
  }
}

function aggregate_data(current){
  console.log(current);
  const byNaics = Object.groupBy(current,({NAICS}) => NAICS);
  const states = alasql("select distinct State from data.data")
  console.log(byNaics);
  let map = {}
  for (const state in states){
    map[states[state].State] = 0;
  }
  const selected = Alpine.store("app")["selected"]

  console.log(selected);
  for (const selection in selected){
    const sel = selected[selection];
    const NAICS = sel[0];
    const cat = sel[1];

    console.log(NAICS);
    console.log(byNaics);
    const entries= byNaics[NAICS]
    console.log(entries);
    entries.forEach((entry)=> {
      const value = processNumber(entry[cat]);
      map[entry.State]+=value;
    });
  }
  return map;

} 

const cateogirs =
  [

    [ "First Quarter Earnings ($1,000)", "FirstQuarter_D" ],
    [ "Total Value Generated ($1,000)", "Value_D" ],
    [ "Total Number Of Workers", "Employees_C" ],
    [ "Total Labor Payroll ($1,000)", "Payroll_D" ],
    [ "Total Value Added ($1,000)", "ValueAdded_D" ],
    [ "Total Yearly Wages", "WagesAnum_D" ],
    [ "Total Hours Worked", "HoursAnum" ],
    [ "Total Constant Capital", "ConstantCapital_D" ],
    [ "Material Cost", "MaterialCost_D" ],
    [
      "Approx. Fixed Capital (material cost - constant capital)",
      "FixedCapital_D"
    ],
    [
      "Approx. Rate Of Exploitation (value added / yearly wages)",
      "RateOfExploitation"
    ]
  ]

  function update (code) {
    let current = [] 
    let aggregated = []
    const mode = Alpine.store("app").aggrigate_mode;
    if (!mode){
      current = alasql (`SELECT *, 

        IFNULL(REPLACE(MaterialCost_D, ',', '')::Number - REPLACE(IFNULL(ConstantCapital_D,0), ',', '')::Number,0) as FixedCapital_D,

        IFNULL(REPLACE(ValueAdded_D, ',', '')::Number / REPLACE(IFNULL(WagesAnum_D,0), ',', '')::Number,0) as RateOfExploitation from data.data where NAICS = ?`,
                              [ Number (code) ])
    }
    else{

      console.log("HERE!");
      const selected = Alpine.store("app")["selected"].map(x=>Number.parseInt(x[0]))
      console.log(selected);

      const set = new Set(selected);
      console.log(Set);
      current = alasql (`SELECT *, 

        IFNULL(REPLACE(MaterialCost_D, ',', '')::Number - REPLACE(IFNULL(ConstantCapital_D,0), ',', '')::Number,0) as FixedCapital_D,

        IFNULL(REPLACE(ValueAdded_D, ',', '')::Number / REPLACE(IFNULL(WagesAnum_D,0), ',', '')::Number,0) as RateOfExploitation from data.data`),

      current = current.filter(x=>set.has(x.NAICS));

      aggregated = aggregate_data(current);
      console.log(aggregated);
    }

    // console.log(code)
    // console.log(current)

    let data = []
    let labels = []
    const cat = Alpine.store("app").category;
    if (!mode){

        data = current.map((d) => ({
                               feature : state_data[d.State][0],
                               value : processNumber (d[cat])
                             }))
      labels = current.map(x=> x.State);
      console.log(data);
    }
    else{
      if (current == null){
        return
      }
      for (const [k, v] of Object.entries(aggregated)) {
        data.push({feature: state_data[k][0], value: v});
        labels.push(k);

      }
      console.log(data);
    }

    console.log(labels);

    let stateData;
     stateData = {
      type : 'choropleth',
      data : {
        labels : labels,
        datasets : [ {
          label : 'States',
          outline : nation,
          data : data,
        } ]
      },
      options : {
        plugins : {
          legend : { display : false },
          tooltip : {
            callbacks :
              { label : function (x) { return makeLabel (x) } }
          }
        },
        scales : {
          projection : {
            axis : 'x',
          },
          color : {
            axis : 'x',
            quantize : 5,
          }
        },
      }
    };

    if (chart != 0)
    {
      chart.destroy()
    }

    chart = new Chart (ctx, stateData)


  }

  Alpine.store('app', {
    options : options,
    update : update,
    categories : cateogirs,
    category : "Value_D",
    code : "311",
    aggrigate_mode : false,
    selected: [[311,"Employees_C"]]

  })
Alpine.start()
Alpine.data('app', () => {

  this.$watch('aggrigate_mode', (newVal, oldVal) =>{
    console.log(newVal);
  })
})

