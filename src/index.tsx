const {
  createTheme,
  Checkbox,
  DefaultButton,
  Fabric,
  loadTheme,
  Pivot,
  PivotItem,
  PrimaryButton,
  Stack,
  Toggle,
} = Fabric;

const myTheme = createTheme({
  palette: {
    themePrimary: "#0078d4",
    themeLighterAlt: "#eff6fc",
    themeLighter: "#deecf9",
    themeLight: "#c7e0f4",
    themeTertiary: "#71afe5",
    themeSecondary: "#2b88d8",
    themeDarkAlt: "#106ebe",
    themeDark: "#005a9e",
    themeDarker: "#004578",
    neutralLighterAlt: "#faf9f8",
    neutralLighter: "#f3f2f1",
    neutralLight: "#edebe9",
    neutralQuaternaryAlt: "#e1dfdd",
    neutralQuaternary: "#d0d0d0",
    neutralTertiaryAlt: "#c8c6c4",
    neutralTertiary: "#a19f9d",
    neutralSecondary: "#605e5c",
    neutralPrimaryAlt: "#3b3a39",
    neutralPrimary: "#323130",
    neutralDark: "#201f1e",
    black: "#000000",
    white: "#ffffff",
  },
});

loadTheme(myTheme);

export const App = () => {
  return (
    <Fabric applyThemeToBody>
      <Stack tokens={{ childrenGap: 8, maxWidth: 300 }}>
        <Pivot>
          <PivotItem headerText="Home" />
          <PivotItem headerText="Pages" />
          <PivotItem headerText="Documents" />
          <PivotItem headerText="Activity" />
        </Pivot>
        <Stack horizontal gap={8}>
          <DefaultButton text="DefaultButton" />
          <PrimaryButton text="PrimaryButton" />
        </Stack>
        <Toggle label="Enabled" />
        <Toggle label="Disabled" disabled={true} />
        <Checkbox label="Checkbox" />
        <Checkbox checked label="Checkbox Checked" />
      </Stack>
    </Fabric>
  );
};
