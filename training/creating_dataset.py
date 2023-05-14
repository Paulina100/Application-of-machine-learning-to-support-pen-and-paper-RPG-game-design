import os.path
import pathlib
from copy import deepcopy

import pandas as pd

from training.analysis_functions import get_merged_bestiaries, unpack_column


DATASETS_DIR = pathlib.Path(__file__).parent.parent / "pathfinder_2e_data"
DATASET_FILES = [
    "pathfinder-bestiary.db",
    "pathfinder-bestiary-2.db",
    "pathfinder-bestiary-3.db",
]
DATASET_PATHS = [f"{DATASETS_DIR}/{file}" for file in DATASET_FILES]


def create_dataframe(
    books: list[str] = DATASET_PATHS,
    characteristics: list[str] = [
        "system/abilities",
        "system/attributes/ac",
        "system/attributes/hp",
    ],
) -> pd.DataFrame:
    """
    Creates dataframe containing chosen characteristics, level (CR) and source book of monsters from chosen books
    :param books: list of paths of books to load
    :param characteristics: list of characteristics to load
    :return: DataFrame with monsters (NPC) form chosen books and with chosen characteristics and their origin book
    """
    loading_methods = {
        "system/abilities": move_values_level_up(value_name="mod"),
        "system/attributes/ac": load_subcolumn_as_value("ac"),
        "system/attributes/hp": load_subcolumn_as_value("hp"),
        "system/attributes/perception": load_subcolumn_as_value("perception"),
        "system/saves": move_values_level_up(value_name="value"),
        "system/saves/fortitude": load_subcolumn_as_value("fortitude"),
        "system/saves/reflex": load_subcolumn_as_value("reflex"),
        "system/saves/will": load_subcolumn_as_value("will"),
    }
    for i in range(len(books) - 1, -1, -1):
        if not is_path_correct(books[i]):
            books.pop(i)

    bestiary = get_merged_bestiaries(books)
    bestiary = bestiary[bestiary["type"] == "npc"]
    df = _create_df_with_basic_values(bestiary)

    for characteristic in characteristics:
        if (loading_method := loading_methods.get(characteristic)) is not None:
            part = loading_method(get_subcolumn(bestiary, characteristic))
            df = pd.concat(
                [
                    df,
                    part,
                ],
                axis=1,
            )

    return df


def is_path_correct(path: str) -> bool:
    """
    Checks whether given path is correct: file exists and correct file extension - json or db
    :param path: path to book to load
    :return: True if path is correct otherwise False
    """
    if not os.path.isfile(path):
        print(f"Path {path} does not exist")
        return False
    if not (path.endswith(".db") or path.endswith(".json")):
        print(f"Expected db or json file, got {path}")
        return False
    return True


def move_values_level_up(value_name: str) -> callable:
    """
    Assigns values of chosen key in columns' dictionaries to that columns
    :param value_name: name of value that should be moved one level up as value of current column/columns
    :return: function which create DataFrame with values of current column(s) changed to value of chosen subcolumn
    """

    def inner_move_values_level_up(df: pd.DataFrame) -> pd.DataFrame:
        return df.applymap(lambda x: x.get(value_name), na_action="ignore")

    return inner_move_values_level_up


def get_subcolumn(book: pd.DataFrame, subcolumn_path: str) -> pd.DataFrame:
    """
    Gets subcolumn of given DataFrame according to given path
    :param book: DataFrame with all data from book(s)
    :param subcolumn_path: path to subcolumn
    :return: chosen subcolumn as DataFrame
    """
    subcol = deepcopy(book)
    for col in subcolumn_path.split("/"):
        subcol = pd.DataFrame(data=unpack_column(subcol, col))

    return subcol


def load_subcolumn_as_value(
    column_name: str, original_column_name: str = "value"
) -> callable:
    """
    Returns a function that creates DataFrame with chosen value_name of given DataFrame
    and changes column name to chosen one
    :param column_name: name that should be given to result dataframe column
    :param original_column_name: name of subcolumn which value will be returned
    :return: function to create Dataframe with chosen column name and values from a chosen subcolumn of current column
    """

    def subcolumn_as_value(df: pd.DataFrame) -> pd.DataFrame:
        result_df = pd.DataFrame(data=df[original_column_name])
        result_df.columns = [column_name]
        return result_df

    return subcolumn_as_value


def _create_df_with_basic_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Creates Dataframes which are obligatory for every dataset
    :param df: DataFrame with all information about monsters
    :return: DataFrame with two obligatory values from df
    """
    lvl = load_subcolumn_as_value("level")(get_subcolumn(df, "system/details/level"))
    lvl.loc[lvl["level"] > 20, "level"] = 21
    book = load_subcolumn_as_value("book")(get_subcolumn(df, "system/details/source"))

    return pd.concat([lvl, book], axis=1)
