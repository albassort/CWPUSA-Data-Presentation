const fs = require ("fs");

const columnAliases = {
  "Geographic Area Name" : "State",
  "2017 NAICS code" : "NAICS",
  "Meaning of NAICS Code" : "Meaning",

  "Sales, value of shipments, or revenue ($1,000)" : "Value_D",
  "Annual payroll ($1,000)" : "Payroll_D",
  "First-quarter payroll ($1,000)" : "FirstQuarter",

  "Number of employees" : "Employees_C",

  "Production workers annual hours (1,000)" : "HoursAnum_T",
  "Production workers annual wages ($1,000)" : "WagesAnum_D",

  "Total cost of materials ($1,000)" : "MaterialCost_D",
  "Value added ($1,000)" : "ValueAdded_D",

  "Total capital expenditures (new and used) ($1,000)" :
    "ConstantCapital_D"
};

let reading_string = false;
const files = fs.readdirSync('./rawcsv');

files.forEach(file => {
  console.log(file);

  const data = fs.readFileSync (`rawcsv/${file}`);
  const length = data.length;

  let pos = -1;
  let header = "";
  let string = '';
  let readAll = false;
  for (const c of data)
  {

    pos += 1;
    const char = String.fromCharCode (c);

    if (readAll){
      header+=char;
      continue
    }
    if (reading_string && char == '"')
    {
      reading_string = false;
    }
    else if (!reading_string && char == '"')
    {
      reading_string = true;
    }

    if (char == ',' && !reading_string)
    {

      console.log(string);
      let parsed = '';
      if (string[0] == '"')
      {
        parsed = string.slice (1, string.length - 1);
      }
      else
      {
        parsed = string
      }

      const contains = columnAliases[parsed];
      if (contains)
      {
        header += contains;
         console.log (string);
         console.log (contains);
      }

      else
      {
        header += string;
      }

      header += ',';

      string = '';
      continue;
    }
    if (char == '\n')
    {
      header += string;
      header += '\n';
      readAll = true;
      continue;
    }

    string += char;
  }


  fs.writeFileSync(`./data/${file}`, header);
  // console.log(done);

});


