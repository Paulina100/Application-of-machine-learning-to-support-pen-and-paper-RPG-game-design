import FileForm from "./FileForm";
import PropertiesForm from "./PropertiesForm";
import {renderHeader} from "../../utils";

const Forms = ({setResultsFunction, monsterProperties, setMonsterProperties}) => {
    const renderCaption = () => {
        return (
            <div className="page-info">
                {renderHeader("First step")}
                <p>You can choose between two ways of entering your monster's properties:
                    you can either manually fill in values of available properties
                    or upload a JSON file with monster's characteristics. </p>
                <p>If you decide to upload a file, you will still be able to edit properties
                    after they are obtained from JSON. The file has to be consistent with
                    Foundry VTT format.</p>
                <p>When upload is finished, section with results will appear below forms.</p>
            </div>
        );
    }

    return (
        <div>
            {renderCaption()}
            <div id="forms-grid">
                {FileForm(setMonsterProperties, setResultsFunction)}
                {PropertiesForm(monsterProperties, setMonsterProperties, setResultsFunction)}
            </div>
        </div>
    );
}

export default Forms;
