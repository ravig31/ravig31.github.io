---
title: Enabling Wake-on-Lan (and WAN) on Ubuntu 24.04
---

For lot of the projects I do I need a dedicated Linux environment to use tools like `perf`. But personally daily driving Ubuntu is not really suitable for me and I enjoy using my M1 Mac too much xd. I wanted a way to wake up my Linux machine when I wasn't home, as I didn't want to leave it running 24/7. This is where I came across Wake-on-LAN (WOL), which allowed me to remotely power on my PC and SSH into it from anywhere. Here is a little guide.
 
## Enable Wake-on-LAN in the BIOS 

The first and most fundamental step is to enable WOL in your motherboard's BIOS/UEFI settings. The exact location of this setting can vary, but you'll typically find it under a menu like "Power Management," "Advanced," or "PME (Power Management Events)." Look for an option like **"Wake on LAN," "Wake on PCI-E,"** or similar and enable it.

Make sure to save your changes and exit the BIOS.

## Configure WOL in Ubuntu

Next, we need to ensure that the network interface in Ubuntu is configured to listen for the magic packet.

### Install and ese `ethtool`

We'll use `ethtool` to check if our network interface supports WOL and to configure it. If you don't have it installed, you can get it with:

```
sudo apt install ethtool
```

Before we configure anything, we need to identify the name of our network interface and its MAC address. Run the following command:

```
ip a
```

The output will list your network interfaces. In my case, the Ethernet interface is named `enp4s0`. Make a note of this and especially the **MAC address**, as you'll need it to send the magic packet later.

Now, let's check if the interface supports and is configured for WOL. Running `ethtool` as root is necessary to see the full settings:


```
sudo ethtool enp4s0
```

Look for the "Supports Wake-on" and "Wake-on" lines in the output. If it supports WOL, it will look something like this:

```
Supports Wake-on: pumbg
Wake-on: d
```

The `pumbg` string indicates that the interface supports different types of wake-on events. The letter `g` is the most important for us, as it signifies support for the **MagicPacket** protocol. The `d` on the `Wake-on` line means it's currently **disabled**. We need to change that.

### Persist the WOL setting with NetworkManager

For the WOL setting to survive a reboot, we need to configure NetworkManager. Ubuntu 24.04 uses NetworkManager to manage network connections, and it's the recommended way to persist these settings.

1. **Check for Active Connections:** First, find the name of your active network connection.
    
    Bash
    
    ```
    nmcli connection show
    ```
    
    You'll get a list of connections. Identify the one for your wired Ethernet interface. Mine's named `"netplan-enp4s0"`.
    
2. **Modify the Connection Profile:** Use `nmcli` to set the `wake-on-lan` property to `magic`.
    
    Bash
    
    ```
    sudo nmcli connection modify "netplan-enp4s0" 802-3-ethernet.wake-on-lan magic
    ```
    
    Replace "netplan-enp4s0" with the actual name from the previous step.
    
3. **Apply and Verify Changes:** Restart NetworkManager to apply the new settings, and then verify that they've been successfully applied.
    
    Bash
    
    ```
    sudo systemctl restart NetworkManager
    nmcli connection show "netplan-enp4s0" | grep 802-3-ethernet.wake-on-lan
    ```
    
    The output should show `802-3-ethernet.wake-on-lan: magic`. 
    


Double check if `Wake on: g`  is set using `sudo ethtool enp4s0`. If this works
your Ubuntu machine is now configured to respond to magic packets. Hooray!

## Problem with dual-booting Windows 11 

If you shut down your PC from Windows, you might find that WOL doesn't work. I learnt that this is because Windows' "Fast Startup" feature (or similar power management settings) can sometimes interfere with WOL functionality. Here's how to fix it:

1. Open the **Device Manager**.
    
2. Expand the **"Network adapters"** section and find your Ethernet adapter.
    
3. Right-click the adapter and go to **Properties**.
    
4. In the **"Advanced"** tab, adjust these settings:
    
    - **"Energy Efficient Ethernet"**: Turn this **off**.
        
    - **"Wake on Magic Packet"**: Set this to **on** or **Enabled**.
        
    - **"Wake on Pattern Match"**: Set this to **on** or **Enabled**.
        
    - **"Wake on Link Settings"**: Set this to **Forced**.
        
    - **"Wait on Link"**: Turn this **on**.
        
5. In the **"Power Management"** tab, make sure the following are checked:
    
    - **"Allow this device to wake the computer"**
        
    - **"Allow only a magic packet to wake the computer"**
        

This configuration ensures the network card remains in a low-power state, but with the necessary listening capabilities active. Additionally, I also disabled hibernation with `powercfg /hibernate off` as this was another fix i found [online](https://superuser.com/questions/1513614/wake-on-lan-doesnt-work-when-power-down-from-windows).


## Sending the magic packet

Now that your PC is configured, you need a way to send the magic packet. I use a MacBook, so I used `wakeonlan` with Homebrew.

1. **Install `wakeonlan`:**
    
    Bash
    
    ```
    brew install wakeonlan
    ```
    
2. **Send the Packet:** Use the MAC address you noted earlier to send the magic packet.
    
    Bash
    
    ```
    wakeonlan a8:5e:45:53:45:a6
    ```
    
    Your PC should now power on.
    


##  WoWww (Wake-on-Wan)
Waking your PC from outside your local network (WAN) is a bit trickier. Directly port-forwarding the WOL packet from your router to your PC often didn't work for me. This is because WOL packets are a broadcast protocol, and routers typically don't allow broadcast traffic to be forwarded from the public internet for security reasons. Here is a [reddit post](https://www.reddit.com/r/HomeServer/comments/10cl7sd/comment/j4gvsr5/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button) on it.

My solution for this is to use a low-power device that's always on, such as an old Raspberry Pi or a mini PC like a NUC.

1. I have a NUC that's always on and acts as a server.
    
2. From my MacBook, I can SSH into the NUC.
    
3. Once connected, I run the `wol` command (for Linux) from the NUC, which is on the same local network as my main PC. The magic packet is sent locally, anddd magically Wake-on-Wan.
    

I think this is this is the most secure method that avoids exposing your network to potential security risks. While there may be other workarounds, this is a very common and effective approach.

Hope this helped! 

`- ravi`
