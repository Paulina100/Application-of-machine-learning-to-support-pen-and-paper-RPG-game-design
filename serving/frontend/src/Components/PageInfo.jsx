import {renderHeader} from "../utils";

const PageInfo = () => {
    return (
        <div className={"page-info"}>
            {renderHeader("Welcome to our app!")}
            <p>Pathfinder Monster Creator is a project supporting pen & paper RPG game design using machine learning.
                It offers such functionalities as calculating monster's level based on its properties
                and generating suggestions how to increase/decrease its level. </p>
            <p>This project was created as the core of the Engineering Thesis titled <br/>"Application of machine learning
                to support pen & paper RPG game design".</p>
        </div>
    );
}

export default PageInfo;