import React, { useState, useEffect } from 'react';
import axios from 'axios';


function Environments() {
  const api_endpoint = "http://"+ process.env.REACT_APP_REST_API_IP + process.env.REACT_APP_REST_API_PORT
  const [environments, setEnvironments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [environmentMap, setEnvironmentMap] = useState({});
  const [locks_infos, setLockInfos] = useState([]);

  useEffect(() => {
    axios.get(api_endpoint + '/reservations')
      .then(response => setReservations(response.data))
      .catch(error => console.log(error));
  }, [api_endpoint]);

  
  useEffect(() => {
    axios.get(api_endpoint + '/lock_infos')
      .then(response => setLockInfos(response.data))
      .catch(error => console.log(error));
  }, [api_endpoint]);

  useEffect(() => {
    const map = {};
    reservations.forEach(reservation => {
      if (!map[reservation.environment_name]) {
        map[reservation.environment_name] = {
          user_id: "",
          reservable: reservation.direct_reservation
        };
      }
      if(map[reservation.environment_name] && reservation.direct_reservation)  {
        map[reservation.environment_name] = {
          user_id: reservation.user_id,
          reservable: true
        };  
      }
    }
    );
    locks_infos.forEach(lock_info => {
      if (!map[lock_info.environment_name]) {
        var locking_user = lock_info.locking_users
        console.log("Locking info users are", locking_user)
        if ([...new Set(locking_user)].length === 1) {
          map[lock_info.environment_name] = {
            user_id: locking_user[0],
            reservable: false
          };
        }else {
          map[lock_info.environment_name] = {
            user_id: "",
            reservable: false
          };
        }      
      }   
    });
    setEnvironmentMap(map);
    console.log('Map value:', map);
  }, [reservations, locks_infos]);


  useEffect(() => {
    async function fetchEnvironments() {
      const response = await fetch(api_endpoint + '/environments?filter=root');
      const data = await response.json();
      console.log('API Response:', data); // <-- Add this line
      setEnvironments(data);
    }
    fetchEnvironments();
  }, [api_endpoint]);

  async function handleAddChildren(environment_name, root_div_id, width, environmentMap){
    document.getElementById("expand-btn-"+environment_name).disabled = true;
    try {
      const response = await fetch(api_endpoint + "/environments/"+environment_name+"/children");
      const data = await response.json();
      var root_div = document.getElementById(root_div_id);
      if(!root_div){
        alert(`Error expanding ${environment_name}`);
      }
      var cell_div = null
      var table_div = null
      // Generate HTML template for each environment
      
      data.forEach(env => {
        var unreserve_button_disable = 
          !environmentMap[env.environment_name] ||
          (environmentMap[env.environment_name] &&
            environmentMap[env.environment_name]['user_id'] === '')
      var reserve_button_disable = 
        (environmentMap[env.environment_name] &&
          environmentMap[env.environment_name]['reservable']) ||
        (environmentMap[env.environment_name] &&
          environmentMap[env.environment_name]['user_id'] === '')
              
        

          var nested_div = document.getElementById(environment_name+"-nested-row");
          if(!nested_div){
            nested_div = document.createElement('div');
            nested_div.setAttribute('id', environment_name+ "-nested-row");
            nested_div.setAttribute('class', "table-row");
            root_div.appendChild(nested_div)
            var ordered_list = document.createElement('ul');
            nested_div.appendChild(ordered_list)
            table_div = document.createElement('div');
            table_div.setAttribute('class', "table");
            table_div.style.paddingLeft = width+"px";
            nested_div.appendChild(table_div)
          }
          
          var row_table = document.createElement('div');
          row_table.setAttribute('id', env.environment_name+ "-root");
          row_table.setAttribute('class', "table");
          table_div.appendChild(row_table)

          var row = document.createElement('div');
          row.setAttribute('id', env.environment_name+ "-row");
          row.setAttribute('class', "table-row");
          row_table.appendChild(row)

          const template = `

            <li><div class="table-cell name"> ${env.environment_name}</div></li>
            <div class="table-cell status">
              ${environmentMap[env.environment_name] ? (
                environmentMap[env.environment_name]['reservable'] ? (
                  '<span style="color: red">Reserved by ' + environmentMap[env.environment_name]['user_id'] + '</span>'
                ) : (
                  environmentMap[env.environment_name]["user_id"] === "" ? (
                    '<span style="color: blue">Unavailable for reservation</span>'
                  ) : (
                    '<span style="color: blue">Unavailable for reservation other than user: ' + environmentMap[env.environment_name]["user_id"] + '</span>'
                  ))
              ) : (
                '<span style="color: green">Available</span>'
              )}
            </div>
            <div class="table-cell button box">
            <button id=reserve-btn-${env.environment_name}>
            Reserve
          </button>
            </div>
            <div class="table-cell button box">
            <button id=unreserve-btn-${env.environment_name}>
            Unreserve
          </button>
            </div>
            <div class="table-cell button box">
              ${env.child_environments ? (
                '<button id=expand-btn-'+env.environment_name+'> expand </button>'
              ) : ''}
            </div>
        `;

        row.innerHTML = template        
        
        
      
        var blocked_env = environmentMap[env.environment_name]
        const reserveBtn = document.getElementById(`reserve-btn-${env.environment_name}`);
        if(reserve_button_disable) {
          reserveBtn.disabled = true
        }else {
          reserveBtn.onclick = function() {
            handleReserve(env.environment_name);
          };
        }
        
        const unreservedBtn = document.getElementById(`unreserve-btn-${env.environment_name}`);
        if(unreserve_button_disable) {
          unreservedBtn.disabled = true
        }else {
          unreservedBtn.onclick = function() {
            handleUnreserve(env.environment_name);
          };
        }
        
        const expandBtn = document.getElementById(`expand-btn-${env.environment_name}`);
          if (expandBtn !== null) {
            expandBtn.onclick = function() {
              handleAddChildren(env.environment_name, env.environment_name+"-root", width*2, environmentMap);
            };
          } 

        });
    } catch (error) {
      alert(`Error expanding ${environment_name}`);
    }
  };
  
  async function handleReserve(environmentName) {
    const username = prompt("Please enter your username:");
  
    if (username !== null) {
      const data = {
        environment_name: environmentName,
        use_case: "manual",
        user_id: username,
      };
  
      try {
        await axios.post(api_endpoint + "/reservation", data);
        alert(`Reservation successful for ${environmentName}`);
        window.location.reload();
      } catch (error) {
        alert(`Error reserving ${environmentName}: ${error.message}`);
      }
    }
  }

  async function handleUnreserve(environmentName) {
    const username = prompt("Please enter your username:");
  
    if (username !== null) {
      const data = {
        environment_name: environmentName,
        use_case: "manual",
        user_id: username,
      };
  
      try {
        await axios.post(api_endpoint + "/clear-reservation", data);
        alert(`Unreservation successful for ${environmentName}`);
        window.location.reload();
      } catch (error) {
        alert(`Error unreserving ${environmentName}: ${error.message}`);
      }
    }
  }

  return (

    
  <div>
  <h2>Environments</h2>
  <div id="root" class="table">
  <ul>
      {environments.map((env) => (
          
          <div id={`${env.environment_name}-root`} class="table">
          <div id={`${env.environment_name}-row`} class="table-row">
          
          <li><div class="table-cell name"> {env.environment_name}</div></li>
          <div class="table-cell status">
            {environmentMap[env.environment_name] ? (
              environmentMap[env.environment_name]['reservable'] ? (
                <span style={{ color: 'red' }}>Reserved by {environmentMap[env.environment_name]['user_id']}</span>
              ) : (
                environmentMap[env.environment_name]["user_id"] === "" ? (
                  <span style={{ color: 'blue' }}>Unavailable for reservation</span>
                ) : (
                  <span style={{ color: 'blue' }}>Unavailable for reservation other than user: {environmentMap[env.environment_name]["user_id"]}</span>
                ))
            ) : (
              <span style={{ color: 'green' }}>Available</span>
            )}
          </div>
          <div class="table-cell button box">
            <button
              disabled={
                (environmentMap[env.environment_name] &&
                  environmentMap[env.environment_name]['reservable']) ||
                (environmentMap[env.environment_name] &&
                  environmentMap[env.environment_name]['user_id'] === '')
              }
              onClick={() => handleReserve(env.environment_name)}
            >
              Reserve
            </button>
          </div>
          <div class="table-cell button box">
            <button
              disabled={
                !environmentMap[env.environment_name] ||
                (environmentMap[env.environment_name] &&
                  environmentMap[env.environment_name]['user_id'] === '')
              }
              onClick={() => handleUnreserve(env.environment_name)}
            >
              Unreserve
            </button>
          </div>
          <div class="table-cell button box">
  {env.child_environments ? (
    <button id={`expand-btn-${env.environment_name}`}onClick={() => handleAddChildren(env.environment_name, env.environment_name+"-root", 30, environmentMap)}>
      expand
    </button>
  ) : null}
</div>
</div>
        </div>
      ))}
      </ul>
      </div> 
</div>  
  );
}

export default Environments;
