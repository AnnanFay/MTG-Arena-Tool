import * as React from 'react';

export default function ReactSelect(props) {
    const formatterFunc = typeof props.optionFormatter === "function" ? props.optionFormatter : string => string;

    const [currentOption, setCurrentOption] = React.useState(props.current);
    const [optionsOpen, setOptionsOpen] = React.useState(false);

    const onClickSelect = React.useCallback(() => {
        setOptionsOpen(!optionsOpen);
    }, [optionsOpen])

    const onClickOption = React.useCallback((event) => {
        setCurrentOption(event.target.value);
        setOptionsOpen(!optionsOpen);
        props.callback && props.callback(event.target.value);
    }, [props.callback, optionsOpen]);

    const buttonClassNames = "button_reset select_button" + (optionsOpen ? " active" : "")

    return(
        <div className={"select_container " + props.divClass} value={currentOption}>
            <button dangerouslySetInnerHTML={{ __html: formatterFunc(currentOption) }} className={buttonClassNames} onClick={onClickSelect} />
            {optionsOpen && <div className={"select_options_container"}>
                {props.options.filter(option => option !== currentOption).map(option => {
                    return (
                        // TODO: fix this before checking things in
                        <button dangerouslySetInnerHTML={{ __html: formatterFunc(option) }} className={"button_reset select_option"} key={option} value={option} onClick={onClickOption} />
                    )
                })}
            </div>}
        </div>
    );
}