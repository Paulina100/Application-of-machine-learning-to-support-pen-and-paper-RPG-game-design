import {
    displaySubmitInfo,
    getActualPropertiesNames,
    getDisplayablePropertiesNames,
    renderSubheader
} from "../../utils";
import {maxPropertyValues, minimumPropertyValues} from "./rules";
import HelpTooltip from "../HelpTooltip";
import {useState} from "react";

const PropertiesForm = (monsterProperties, setMonsterProperties, setResults) => {
    const [isGroupVisible, setIsGroupVisible] = useState({});

    const properties = getDisplayablePropertiesNames();
    const actualProperties = getActualPropertiesNames();

    const validatePressedKey = (event, propertyName) => {
        const allowedKeys = ["Backspace", "Enter", "Tab", "ArrowLeft", "ArrowRight", "ArrowTop", "ArrowDown"];
        if (propertyName === "avg_melee_dmg" || propertyName === "avg_ranged_dmg") {
            allowedKeys.push(".")
        }
        if (!/[0-9]/.test(event.key) && !allowedKeys.includes(event.key) && event.key !== "-") {
            event.preventDefault();
        }
        if (event.key === "-" && monsterProperties[propertyName] !== undefined && monsterProperties[propertyName] !== "") {
            event.preventDefault();
        }
        if ((propertyName === "avg_melee_dmg" || propertyName === "avg_ranged_dmg") &&
            monsterProperties[propertyName] !== undefined &&
            monsterProperties[propertyName].indexOf(".") !== -1) {
            // prevent multiple "."
            if (event.key === ".") {
                event.preventDefault();
            }
            // allow only 0 or 5 after "."
            if (monsterProperties[propertyName].endsWith(".") && event.key !== "0" && event.key !== "5" && !allowedKeys.includes(event.key)) {
                event.preventDefault();
            }
            // allow only one digit after "."
            if (monsterProperties[propertyName].indexOf(".") === monsterProperties[propertyName].length - 2  && !allowedKeys.includes(event.key)) {
                event.preventDefault();
            }
        }

    }

    const validateInput = (property, isRequired) => {
        const value = property === "avg_melee_dmg" || property === "avg_ranged_dmg" ?
            parseFloat(monsterProperties[property]) :
            parseInt(monsterProperties[property]);
        const inputCell = document.getElementById(property);
        if ((isRequired && isNaN(value)) ||
            value < minimumPropertyValues.get(property) ||
            (maxPropertyValues.get(property) !== undefined && value > maxPropertyValues.get(property))) {
            inputCell.className = "invalid-input";
        } else {
            inputCell.className = "";
        }
    }

    const renderPropertiesFormRow = (property, actualProperty, isRequired) => {
        return (
            <div className="properties-form-row" key={actualProperty}>
                <label htmlFor={actualProperty} id="properties-form-label">{property}</label>
                <input id={actualProperty} name={actualProperty} type="text" required={isRequired}
                       onKeyDown={(event) => {
                           validatePressedKey(event, actualProperty);
                       }}
                       onChange={(event) => {
                           setMonsterProperties(monsterProperties => ({
                               ...monsterProperties,
                               ...{[actualProperty]: event.target.value}
                           }));
                       }}
                       onBlur={() => {validateInput(actualProperty, isRequired)}}
                       value={(monsterProperties === null) ? "" : monsterProperties[actualProperty]}/>
                <HelpTooltip
                    helpText={`Enter a number greater than or equal to ${minimumPropertyValues.get(actualProperty)}` +
                        `${maxPropertyValues.get(actualProperty) !== undefined ? 
                            ` and smaller than or equal to ${maxPropertyValues.get(actualProperty)}` : 
                            ""}`}
                />
            </div>
        );
    }

    const renderComplexPropertiesFormRow = (complexProperty, actualComplexProperty) => {
        const groupName = complexProperty[0];
        return (
            <div className={"properties-group"}>
                <span className={"properties-form-row"}
                   onClick={() =>
                       setIsGroupVisible(isGroupVisible =>
                           ({...isGroupVisible, ...{[groupName]: !isGroupVisible[groupName]}})
                       )}>
                    {isGroupVisible[groupName] ? "˅" : "˃"} {groupName}
                </span>
                <div className={"properties-group-rows"}
                     style={{visibility: isGroupVisible[groupName] ? "visible" : "hidden",
                         height: isGroupVisible[groupName] ? "max-content" : "0"}}>
                    {complexProperty[1].map((value, i) =>
                        renderPropertiesFormRow(value, actualComplexProperty[i], false))}
                </div>
            </div>
        );
    }

    const renderNameFormRow = () => {
        return (
            <div className="properties-form-row">
                <label htmlFor="name" id="properties-form-label">Name</label>
                <input id="name" name="name" type="text" required
                       onChange={(event) => {
                           setMonsterProperties({"name": event.target.value});
                       }}
                       value={(monsterProperties === null) ? "" : monsterProperties["name"]}/>
            </div>
        );
    }

    const fillNotRequiredProperties = () => {
        let newMonsterProperties = {"name": monsterProperties.name};
        actualProperties[0].forEach((value) => {newMonsterProperties[value] = monsterProperties[value]})
        actualProperties[1].concat(actualProperties[2]).forEach((value) => {
            if (typeof value === "string") {
                if (!monsterProperties.hasOwnProperty(value) || monsterProperties[value] === "") {
                    newMonsterProperties[value] = "0";
                } else {
                    newMonsterProperties[value] = monsterProperties[value];
                }
            } else {
                value.forEach((subvalue) => {
                    if (!monsterProperties.hasOwnProperty(subvalue) || monsterProperties[subvalue] === "") {
                        newMonsterProperties[subvalue] = "0";
                    } else {
                        newMonsterProperties[subvalue] = monsterProperties[subvalue];
                    }
                })
            }
        });
        setMonsterProperties(newMonsterProperties);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const formJson = Object.fromEntries(formData.entries());
        setMonsterProperties(formJson);
        fillNotRequiredProperties();
        const propertiesCheckInterval = setInterval(() => {
            if (Object.keys(monsterProperties).length === 51) {
                clearInterval(propertiesCheckInterval);

                for (let property in monsterProperties) {
                    if (property === "name") {
                        continue;
                    }
                    const value = property === "avg_melee_dmg" || property === "avg_ranged_dmg" ?
                        parseFloat(monsterProperties[property]) :
                        parseInt(monsterProperties[property]);
                    if (isNaN(value) ||
                        value < minimumPropertyValues.get(property) ||
                        (maxPropertyValues.get(property) !== undefined && value > maxPropertyValues.get(property))) {
                        window.alert("Entered input is invalid. Form will not be submitted.");
                        return;
                    }
                }
                setResults({});

                let serverUrl;
                if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                    serverUrl = process.env.REACT_APP_HOST;
                } else {
                    serverUrl = process.env.REACT_APP_AWS_HOST;
                }

                fetch(serverUrl + process.env.REACT_APP_UPLOAD_ENDPOINT, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(Object.entries(monsterProperties).filter(([key]) => key !== "name"))
                }).then((response) => {
                    response.json().then(json => setResults(json));
                    displaySubmitInfo("properties-submit-button", "properties-form");
                }).catch(error => {
                    alert(error);
                });
            }
        }, 500);


    }

    return (
        <div id="properties-form-container">
            {renderSubheader("Insert monster's properties")}
            <form onSubmit={handleSubmit} id={"properties-form"}>
                <div className={"properties-grid"}>
                    <div className={"properties-column"}>
                        {renderNameFormRow()}
                        {properties[0].map((value, i) =>
                            renderPropertiesFormRow(value, actualProperties[0][i], true))}
                    </div>
                    <div className={"properties-column"}>
                        {properties[1].map((value, i) => {
                            if (typeof value === "string") {
                                return renderPropertiesFormRow(value, actualProperties[1][i], false)
                            } else {
                                return renderComplexPropertiesFormRow(value, actualProperties[1][i])
                            }
                        })}
                    </div>
                    <div className={"properties-column"}>
                        {properties[2].map((value, i) => {
                            if (typeof value === "string") {
                                return renderPropertiesFormRow(value, actualProperties[2][i], false)
                            } else {
                                return renderComplexPropertiesFormRow(value, actualProperties[2][i])
                            }
                        })}
                    </div>
                </div>
                <button type="submit" id="properties-submit-button">Submit</button>
            </form>
        </div>
    );
}

export default PropertiesForm;
